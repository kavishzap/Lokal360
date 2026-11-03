"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Pencil, ShoppingBasket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { CategoryForm } from "@/components/categories/category-form";
import { MenuItemCard } from "@/components/menu-items/menu-item-card";
import { MenuItemForm } from "@/components/menu-items/menu-item-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { useTranslate } from "@/i18n/use-translate";
import { formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { MenuItem } from "@/types";

export default function MenuItemsPage() {
  const menuItems = useAppStore((state) => state.menuItems);
  const categories = useAppStore((state) => state.categories);
  const deleteMenuItem = useAppStore((state) => state.deleteMenuItem);
  const toggleMenuAvailability = useAppStore((state) => state.toggleMenuAvailability);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>("all");
  const [availability, setAvailability] = useState<string | null>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const { t } = useTranslate();

  useCreateRequest("menu-item", () => {
    setEditing(null);
    setOpen(true);
  });

  const filtered = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.nameEn ?? "").toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        categoryId === "all" || categoryId == null || item.categoryId === categoryId;
      const matchesAvailability =
        availability === "all" ||
        availability == null ||
        (availability === "available" ? item.isAvailable : !item.isAvailable);
      return matchesQuery && matchesCategory && matchesAvailability;
    });
  }, [menuItems, query, categoryId, availability]);

  const columns: DataTableColumn<MenuItem>[] = [
    {
      header: "Item",
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-12 overflow-hidden rounded-lg bg-slate-100">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.name} className="size-full object-cover" />
            ) : null}
          </div>
          <div>
            <p className="font-medium">{item.name}</p>
            {item.nameEn && item.nameEn !== item.name ? (
              <p className="text-xs text-slate-500">{item.nameEn}</p>
            ) : null}
            <p className="text-xs text-slate-500">
              {categories.find((category) => category.id === item.categoryId)?.name}
            </p>
          </div>
        </div>
      ),
    },
    { header: "Price", cell: (item) => formatMUR(item.price) },
    { header: t("Manufactured"), cell: (item) => formatMUR(item.manufacturedPrice ?? 0) },
    { header: "Ingredients", cell: (item) => item.ingredients.length },
    {
      header: "Available",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Switch checked={item.isAvailable} onCheckedChange={() => toggleMenuAvailability(item.id)} />
          <StatusBadge
            active={item.isAvailable}
            activeLabel="Available"
            inactiveLabel="Unavailable"
          />
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(item);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(item)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Menu items"
        description="Sellable dishes with recipes, category and Mauritian Rupee pricing."
        actionLabel="Add menu item"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <Button variant="outline" className="h-9 px-3" onClick={() => setCategoryOpen(true)}>
          {t("Add category")}
        </Button>
        <div className="flex rounded-lg border bg-white p-0.5">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("grid")}
          >
            <LayoutGrid />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("list")}
          >
            <List />
          </Button>
        </div>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search menu items..." />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger className="h-9 w-full bg-white">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="No menu items found"
          description="Create dishes with a category, selling price and ingredient recipe."
          actionLabel="Add menu item"
          onAction={() => {
            setEditing(null);
            setOpen(true);
          }}
        />
      ) : view === "list" ? (
        <DataTable data={filtered} columns={columns} rowKey={(item) => item.id} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              category={categories.find((category) => category.id === item.categoryId)}
              onEdit={() => {
                setEditing(item);
                setOpen(true);
              }}
              onDelete={() => setDeleting(item)}
              onToggle={() => toggleMenuAvailability(item.id)}
            />
          ))}
        </div>
      )}

      <CategoryForm open={categoryOpen} onOpenChange={setCategoryOpen} />
      <MenuItemForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        item={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete menu item?"
        description={`This will remove ${deleting?.name ?? "the item"} from the menu.`}
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteMenuItem(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Menu item deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
