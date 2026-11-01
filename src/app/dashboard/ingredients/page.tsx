"use client";

import { useMemo, useState } from "react";
import { Leaf, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { IngredientForm } from "@/components/ingredients/ingredient-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { unitDisplayName } from "@/lib/units";
import { useAppStore } from "@/store/app-store";
import type { Ingredient } from "@/types";

export default function IngredientsPage() {
  const ingredients = useAppStore((state) => state.ingredients);
  const units = useAppStore((state) => state.units);
  const menuItems = useAppStore((state) => state.menuItems);
  const inventory = useAppStore((state) => state.inventory);
  const deleteIngredient = useAppStore((state) => state.deleteIngredient);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState<Ingredient | null>(null);

  useCreateRequest("ingredient", () => {
    setEditing(null);
    setOpen(true);
  });

  const filtered = useMemo(() => {
    return ingredients.filter((ingredient) => {
      const matchesQuery =
        !query ||
        ingredient.name.toLowerCase().includes(query.toLowerCase()) ||
        ingredient.description.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        status === "all" ||
        status == null ||
        (status === "active" ? ingredient.isActive : !ingredient.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [ingredients, query, status]);

  const columns: DataTableColumn<Ingredient>[] = [
    {
      header: "Ingredient",
      cell: (ingredient) => (
        <div>
          <p className="font-medium">{ingredient.name}</p>
          <p className="max-w-sm truncate text-xs text-slate-500">
            {ingredient.description || "—"}
          </p>
        </div>
      ),
    },
    { header: "Unit", cell: (ingredient) => unitDisplayName(units, ingredient.unitId) },
    {
      header: "Linked menu items",
      cell: (ingredient) =>
        menuItems.filter((item) =>
          item.ingredients.some((row) => row.ingredientId === ingredient.id)
        ).length,
    },
    {
      header: "Inventory",
      cell: (ingredient) =>
        inventory.some((item) => item.ingredientId === ingredient.id) ? "Tracked" : "Not tracked",
    },
    { header: "Status", cell: (ingredient) => <StatusBadge active={ingredient.isActive} /> },
    {
      header: "Actions",
      className: "text-right",
      cell: (ingredient) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditing(ingredient);
              setOpen(true);
            }}
          >
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(ingredient)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ingredients"
        description="Master data for recipes. Stock quantities are managed in Inventory, not here."
        actionLabel="Add ingredient"
        onAction={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search ingredients..."
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
        rowKey={(ingredient) => ingredient.id}
        empty={
          <EmptyState
            icon={Leaf}
            title="No ingredients found"
            description="Add reusable ingredients such as chicken, cheese or flour."
            actionLabel="Add ingredient"
            onAction={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        }
      />
      <IngredientForm
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
        ingredient={editing}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete ingredient?"
        description="Ingredients linked to menu items or inventory records cannot be deleted."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteIngredient(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Ingredient deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
