"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormModal, Field } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lineAmount } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Purchase, PurchaseLine } from "@/types";

export function PostInventoryDialog({
  open,
  onOpenChange,
  purchase,
  line,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase | null;
  line: PurchaseLine | null;
}) {
  return (
    <PostInventoryDialogInner
      key={`${open ? "open" : "closed"}-${line?.id ?? "none"}`}
      open={open}
      onOpenChange={onOpenChange}
      purchase={purchase}
      line={line}
    />
  );
}

function PostInventoryDialogInner({
  open,
  onOpenChange,
  purchase,
  line,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase | null;
  line: PurchaseLine | null;
}) {
  const ingredients = useAppStore((state) => state.ingredients);
  const postPurchaseLineToInventory = useAppStore((state) => state.postPurchaseLineToInventory);
  const [ingredientId, setIngredientId] = useState<string | null>(line?.ingredientId ?? null);

  const onSubmit = () => {
    if (!purchase || !line) return;
    const result = postPurchaseLineToInventory(purchase.id, line.id, ingredientId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Line posted to inventory");
    onOpenChange(false);
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add to inventory"
      description="This increases stock and reclassifies the purchase from expense to the inventory account."
    >
      {purchase && line ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {line.quantity} × {line.description} for {formatMUR(lineAmount(line))} from{" "}
            {purchase.number}.
          </p>
          <Field label="Ingredient">
            <Select value={ingredientId} onValueChange={setIngredientId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select ingredient" />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map((ingredient) => (
                  <SelectItem key={ingredient.id} value={ingredient.id}>
                    {ingredient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit}>
              Post to inventory
            </Button>
          </div>
        </div>
      ) : null}
    </FormModal>
  );
}
