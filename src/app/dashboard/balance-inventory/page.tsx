"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatQty,
  runInventoryBalance,
  type BalanceRow,
  type BalanceStatus,
} from "@/lib/balance-inventory";
import { formatDateTime } from "@/lib/format";
import { unitAbbreviation } from "@/lib/units";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const STATUS_LABEL: Record<BalanceStatus, { label: string; className: string; dot: string }> = {
  balanced: { label: "Tallying", className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  unrecorded: { label: "Not booked out", className: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  over_recorded: { label: "Extra stock out", className: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
  shortage: { label: "Cannot cover orders", className: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export default function BalanceInventoryPage() {
  const router = useRouter();
  const orders = useAppStore((state) => state.orders);
  const menuItems = useAppStore((state) => state.menuItems);
  const ingredients = useAppStore((state) => state.ingredients);
  const inventory = useAppStore((state) => state.inventory);
  const transactions = useAppStore((state) => state.transactions);
  const units = useAppStore((state) => state.units);
  const [report, setReport] = useState<ReturnType<typeof runInventoryBalance> | null>(null);
  const [query, setQuery] = useState("");

  const runCheck = () => {
    setReport(
      runInventoryBalance({
        orders,
        menuItems,
        ingredients,
        inventory,
        transactions,
      })
    );
  };

  const filtered = useMemo(() => {
    if (!report) return [];
    return report.rows.filter((row) => {
      if (!query) return true;
      return row.ingredientName.toLowerCase().includes(query.toLowerCase());
    });
  }, [report, query]);

  const columns: DataTableColumn<BalanceRow>[] = [
    {
      header: "Ingredient",
      cell: (row) => <span className="font-medium">{row.ingredientName}</span>,
    },
    {
      header: "Used by orders",
      cell: (row) => `${formatQty(row.theoreticalUsage)} ${unitAbbreviation(units, row.unitId)}`,
    },
    {
      header: "Booked out",
      cell: (row) => `${formatQty(row.recordedOut)} ${unitAbbreviation(units, row.unitId)}`,
    },
    {
      header: "Variance",
      cell: (row) => {
        const prefix = row.variance > 0 ? "+" : "";
        return (
          <span className={row.status === "balanced" ? "text-slate-700" : "font-medium text-slate-900"}>
            {prefix}
            {formatQty(row.variance)} {unitAbbreviation(units, row.unitId)}
          </span>
        );
      },
    },
    {
      header: "On hand",
      cell: (row) => `${formatQty(row.currentStock)} ${unitAbbreviation(units, row.unitId)}`,
    },
    {
      header: "Needed for open orders",
      cell: (row) => `${formatQty(row.openRequirement)} ${unitAbbreviation(units, row.unitId)}`,
    },
    {
      header: "Status",
      cell: (row) => {
        const tone = STATUS_LABEL[row.status];
        return (
          <Badge variant="outline" className={cn("border-transparent font-medium", tone.className)}>
            <span className={cn("mr-1 size-1.5 rounded-full", tone.dot)} />
            {tone.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Balance inventory"
        description="Run a check to see whether recipes from orders match what has been booked out of stock."
      >
        <Button className="h-9 px-4" onClick={runCheck}>
          <Scale />
          {report ? "Run check again" : "Run balance check"}
        </Button>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How this helps</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <p>
            <span className="font-medium text-slate-900">Used by orders</span> is what recipes say
            should have been consumed from non-cancelled orders.
          </p>
          <p>
            <span className="font-medium text-slate-900">Booked out</span> is stock actually removed
            or written down in Inventory. Orders do not deduct stock automatically.
          </p>
          <p>
            <span className="font-medium text-slate-900">All good</span> means usage and stock-out
            match, and current stock can cover open and preparing orders.
          </p>
        </CardContent>
      </Card>

      {!report ? (
        <EmptyState
          icon={Scale}
          title="No balance check yet"
          description="Click Run balance check to compare order recipes with inventory movements and see if anything is short or not booked out."
          actionLabel="Run balance check"
          onAction={runCheck}
        />
      ) : (
        <>
          <div
            className={cn(
              "mb-6 flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
              report.overall === "good" && "border-emerald-200 bg-emerald-50",
              report.overall === "attention" && "border-amber-200 bg-amber-50",
              report.overall === "critical" && "border-red-200 bg-red-50"
            )}
          >
            <div className="flex items-start gap-3">
              {report.overall === "good" ? (
                <ShieldCheck className="mt-0.5 size-5 text-emerald-700" />
              ) : report.overall === "critical" ? (
                <ShieldAlert className="mt-0.5 size-5 text-red-700" />
              ) : (
                <AlertTriangle className="mt-0.5 size-5 text-amber-700" />
              )}
              <div>
                <p className="font-semibold text-slate-900">
                  {report.overall === "good"
                    ? "Orders and inventory tally"
                    : report.overall === "critical"
                      ? "Open orders cannot be fully covered"
                      : "Orders and inventory are out of balance"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Last checked {formatDateTime(report.ranAt)}. Cancelled orders are ignored.
                </p>
              </div>
            </div>
            <Button variant="outline" className="h-9 bg-white" onClick={() => router.push("/dashboard/inventory")}>
              Open inventory
            </Button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Tallying"
              value={report.balancedCount}
              hint="Usage matches stock booked out"
              icon={CheckCircle2}
              tone="green"
            />
            <StatCard
              title="Not booked out"
              value={report.unrecordedCount}
              hint="Orders used more than inventory recorded"
              icon={AlertTriangle}
              tone="amber"
            />
            <StatCard
              title="Extra stock out"
              value={report.overRecordedCount}
              hint="More stock removed than recipes explain"
              icon={Scale}
              tone="slate"
            />
            <StatCard
              title="Cannot cover orders"
              value={report.shortageCount}
              hint="Open orders need more than current stock"
              icon={ShieldAlert}
              tone="red"
            />
          </div>

          <div className="mb-4">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search ingredients..."
              className="sm:max-w-xs"
            />
          </div>

          <DataTable
            data={filtered}
            columns={columns}
            rowKey={(row) => row.ingredientId}
            empty={
              <EmptyState
                icon={Scale}
                title="Nothing to compare"
                description="There are no non-cancelled orders using recipe ingredients yet."
              />
            }
          />
        </>
      )}
    </div>
  );
}
