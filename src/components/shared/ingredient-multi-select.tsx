"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { unitAbbreviation } from "@/lib/units";
import { useAppStore } from "@/store/app-store";
import type { Ingredient, MenuItemIngredient } from "@/types";

export function IngredientMultiSelect({
  ingredients,
  value,
  onChange,
}: {
  ingredients: Ingredient[];
  value: MenuItemIngredient[];
  onChange: (value: MenuItemIngredient[]) => void;
}) {
  const units = useAppStore((state) => state.units);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const selectedIds = new Set(value.map((row) => row.ingredientId));
    const q = query.trim().toLowerCase();
    return ingredients.filter((ingredient) => {
      if (selectedIds.has(ingredient.id)) return false;
      if (!q) return true;
      return ingredient.name.toLowerCase().includes(q);
    });
  }, [ingredients, query, value]);

  const add = (ingredientId: string) => {
    onChange([...value, { ingredientId, quantity: 1 }]);
    setQuery("");
  };

  const updateQty = (ingredientId: string, quantity: number) => {
    onChange(value.map((row) => (row.ingredientId === ingredientId ? { ...row, quantity } : row)));
  };

  const remove = (ingredientId: string) => {
    onChange(value.filter((row) => row.ingredientId !== ingredientId));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-slate-50 p-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search ingredients to add..."
          className="h-9 bg-white"
        />
        <div className="mt-2 max-h-36 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-1 py-3 text-xs text-slate-500">No matching ingredients.</p>
          ) : (
            results.slice(0, 8).map((ingredient) => (
              <button
                key={ingredient.id}
                type="button"
                onClick={() => add(ingredient.id)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white"
              >
                <span>
                  {ingredient.name}
                  {!ingredient.isActive ? (
                    <Badge variant="secondary" className="ml-2">
                      Inactive
                    </Badge>
                  ) : null}
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  {unitAbbreviation(units, ingredient.unitId)}
                  <Plus className="size-3.5" />
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        {value.length === 0 ? (
          <p className="text-sm text-slate-500">No ingredients in this recipe yet.</p>
        ) : (
          value.map((row) => {
            const ingredient = ingredients.find((item) => item.id === row.ingredientId);
            if (!ingredient) return null;
            return (
              <div
                key={row.ingredientId}
                className="flex items-center gap-2 rounded-lg border bg-white p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ingredient.name}</p>
                  <p className="text-xs text-slate-500">{unitAbbreviation(units, ingredient.unitId)}</p>
                </div>
                <Input
                  type="number"
                  min={0.001}
                  step="any"
                  value={row.quantity}
                  onChange={(event) => updateQty(row.ingredientId, Number(event.target.value))}
                  className="h-8 w-24"
                />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(row.ingredientId)}>
                  <X />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
