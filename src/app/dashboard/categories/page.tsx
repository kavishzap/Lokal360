"use client";

import { useMemo, useState } from "react";
import { Pencil, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { CategoryForm } from "@/components/categories/category-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { useAppStore } from "@/store/app-store";
import type { MenuCategory } from "@/types";

export default function CategoriesPage() {
  const categories = useAppStore((state) => state.categories);
  const menuItems = useAppStore((state) => state.menuItems);
  const deleteCategory = useAppStore((state) => state.deleteCategory);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [deleting, setDeleting] = useState<MenuCategory | null>(null);

  useCreateRequest("category", () => {
    setEditing(null);
    setOpen(true);
  });

  const filtered = useMemo(() => {
    return [...categories]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((category) => {
        const matchesQuery =
          !query ||
          category.name.toLowerCase().includes(query.toLowerCase()) ||
          category.description.toLowerCase().includes(query.toLowerCase());
        const matchesStatus =
          status === "all" ||
          status == null ||
          (status === "active" ? category.isActive : !category.isActive);
        return matchesQuery && matchesStatus;
      });
  }, [categories, query, status]);

  const columns: DataTableColumn<MenuCategory>[] = [
    {
      header: "Category",
      cell: (category) => (
        <div>
          <p className="font-medium">{category.name}</p>
          <p className="max-w-xs truncate text-xs text-slate-500">{category.description || "—"}</p>
        </div>
      ),
    },
    {
      header: "Menu items",
      cell: (category) => menuItems.filter((item) => item.categoryId === category.id).length,
    },
    { header: "Status", cell: (category) => <StatusBadge active={category.isActive} /> },
    {
      header: "Actions",
      className: "text-right",
      cell: (category) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(category);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(category)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organise the menu. Categories with linked items cannot be deleted."
        actionLabel="Add category"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search categories..."
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(category) => category.id}
        empty={
          <EmptyState
            icon={Tags}
            title="No categories found"
            description="Create categories such as Starters, Burgers or Desserts."
            actionLabel="Add category"
            onAction={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        }
      />
      <CategoryForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        category={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete category?"
        description="Categories that still contain menu items cannot be deleted."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteCategory(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Category deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
