"use client";

import { useMemo, useState } from "react";
import { Car, TimerReset, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AssetForm } from "@/components/accounting/asset-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/use-create-request";
import { accountBalance, accountByCode, SYSTEM_ACCOUNT_CODES } from "@/lib/accounting";
import {
  ASSET_CATEGORIES,
  assetCategoryLabel,
  assetTotals,
  bookValue,
  FUNDING_LABEL,
  monthlyDepreciation,
  pendingDepreciation,
} from "@/lib/assets";
import { formatDate, formatMUR } from "@/lib/format";
import { inventoryValue } from "@/lib/inventory";
import { useAppStore } from "@/store/app-store";
import type { FixedAsset } from "@/types";

export default function AssetsPage() {
  const assets = useAppStore((state) => state.assets ?? []);
  const accounts = useAppStore((state) => state.accounts);
  const journals = useAppStore((state) => state.journalEntries);
  const inventory = useAppStore((state) => state.inventory);
  const deleteAsset = useAppStore((state) => state.deleteAsset);
  const chargeAssetDepreciation = useAppStore((state) => state.chargeAssetDepreciation);
  const chargeAllDepreciation = useAppStore((state) => state.chargeAllDepreciation);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>("all");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<FixedAsset | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useCreateRequest("asset", () => setOpen(true));

  const filtered = useMemo(() => {
    return [...assets]
      .sort((a, b) => b.acquiredOn.localeCompare(a.acquiredOn) || a.number.localeCompare(b.number))
      .filter((asset) => {
        const matchesQuery =
          !query ||
          asset.name.toLowerCase().includes(query.toLowerCase()) ||
          asset.number.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "all" || category == null || asset.category === category;
        return matchesQuery && matchesCategory;
      });
  }, [assets, query, category]);

  const totals = assetTotals(assets);
  const stockValue = inventory.reduce((sum, item) => sum + inventoryValue(item), 0);
  const cash = accountByCode(accounts, SYSTEM_ACCOUNT_CODES.cash);
  const bank = accountByCode(accounts, SYSTEM_ACCOUNT_CODES.bank);
  const cashValue = cash ? accountBalance(cash, journals).balance : 0;
  const bankValue = bank ? accountBalance(bank, journals).balance : 0;
  const businessValue = totals.book + stockValue + cashValue + bankValue;
  const pending = assets.reduce((sum, asset) => sum + pendingDepreciation(asset, today), 0);

  const columns: DataTableColumn<FixedAsset>[] = [
    {
      header: "Asset",
      cell: (asset) => (
        <div>
          <p className="font-medium">{asset.name}</p>
          <p className="text-xs text-slate-500">
            {asset.number} · {assetCategoryLabel(asset.category)}
          </p>
        </div>
      ),
    },
    { header: "Acquired", cell: (asset) => formatDate(asset.acquiredOn) },
    { header: "Cost", cell: (asset) => formatMUR(asset.cost) },
    {
      header: "Depreciation",
      cell: (asset) =>
        asset.depreciates ? (
          <div>
            <p>{formatMUR(monthlyDepreciation(asset))} / month</p>
            <p className="text-xs text-slate-500">
              {asset.usefulLifeMonths / 12} years · residual {formatMUR(asset.residualValue)}
            </p>
          </div>
        ) : (
          <Badge variant="outline">Does not depreciate</Badge>
        ),
    },
    { header: "Written down", cell: (asset) => formatMUR(asset.accumulatedDepreciation) },
    {
      header: "Book value",
      cell: (asset) => <span className="font-medium">{formatMUR(bookValue(asset))}</span>,
    },
    { header: "Funded by", cell: (asset) => FUNDING_LABEL[asset.funding] },
    {
      header: "Actions",
      className: "text-right",
      cell: (asset) => (
        <div className="flex justify-end gap-1">
          {asset.depreciates ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={pendingDepreciation(asset, today) <= 0}
              onClick={() => {
                const result = chargeAssetDepreciation(asset.id, today);
                if (!result.ok) toast.error(result.error);
                else toast.success(`Depreciation posted for ${asset.name}`);
              }}
            >
              Charge
            </Button>
          ) : null}
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(asset)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Assets"
        description="The register of vehicles, kitchen plant, furniture and land. Book value is cost less accumulated depreciation, which is what the business is worth in the books."
        actionLabel="Register asset"
        onAction={() => setOpen(true)}
      >
        <Button
          variant="outline"
          className="h-9"
          onClick={() => {
            const result = chargeAllDepreciation(today);
            if (!result.ok) toast.error(result.error);
            else toast.success(result.warning ?? "Depreciation posted");
          }}
        >
          <TimerReset /> Run depreciation
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Asset cost" value={formatMUR(totals.cost)} icon={Car} />
        <StatCard title="Written down" value={formatMUR(totals.accumulated)} icon={Car} tone="amber" />
        <StatCard title="Fixed assets book value" value={formatMUR(totals.book)} icon={Car} tone="green" />
        <StatCard
          title="Business value (books)"
          value={formatMUR(businessValue)}
          icon={Car}
          tone="blue"
          hint={`Assets ${formatMUR(totals.book)} + stock ${formatMUR(stockValue)} + cash ${formatMUR(cashValue + bankValue)}`}
        />
      </div>

      {pending > 0 ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {formatMUR(pending)} of depreciation is waiting. Run depreciation to bring book values up to today.
        </p>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search assets..."
          className="sm:max-w-xs"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-full bg-white sm:w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {ASSET_CATEGORIES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(asset) => asset.id}
        empty={
          <EmptyState
            icon={Car}
            title="No assets registered"
            description="Add vehicles, ovens, furniture or land so the books show the real value of the business."
            actionLabel="Register asset"
            onAction={() => setOpen(true)}
          />
        }
      />

      <AssetForm open={open} onOpenChange={setOpen} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete asset?"
        description="Assets with depreciation posted cannot be deleted."
        onConfirm={() => {
          if (!deleting) return;
          const result = deleteAsset(deleting.id);
          if (!result.ok) toast.error(result.error);
          else toast.success("Asset deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
