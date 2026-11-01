"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Armchair,
  Boxes,
  ClipboardList,
  Leaf,
  MapPinned,
  Plus,
  ShoppingBasket,
  Tags,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { InventoryStatusBadge } from "@/components/shared/inventory-status-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStockStatus } from "@/lib/inventory";
import { formatMUR } from "@/lib/format";
import { unitAbbreviation } from "@/lib/units";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

export default function DashboardPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const requestCreate = useUiStore((state) => state.requestCreate);
  const zones = useAppStore((state) => state.zones);
  const tables = useAppStore((state) => state.tables);
  const categories = useAppStore((state) => state.categories);
  const ingredients = useAppStore((state) => state.ingredients);
  const units = useAppStore((state) => state.units);
  const menuItems = useAppStore((state) => state.menuItems);
  const inventory = useAppStore((state) => state.inventory);

  const lowStock = inventory.filter((item) => getStockStatus(item) === "low_stock");
  const outOfStock = inventory.filter((item) => getStockStatus(item) === "out_of_stock");
  const recentItems = [...menuItems]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const tablesByZone = zones.map((zone) => ({
    zone,
    count: tables.filter((table) => table.zoneId === zone.id).length,
  }));

  const chartData = useMemo(
    () => [
      { name: "In stock", value: inventory.filter((item) => getStockStatus(item) === "in_stock").length, color: "#16A34A" },
      { name: "Low stock", value: lowStock.length, color: "#F59E0B" },
      { name: "Out of stock", value: outOfStock.length, color: "#DC2626" },
    ],
    [inventory, lowStock.length, outOfStock.length]
  );

  const goCreate = (path: string, target: Parameters<typeof requestCreate>[0]) => {
    requestCreate(target);
    router.push(path);
  };

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${session?.name.split(" ")[0] ?? "there"}`}
        description="B42 Bistro operations overview. Figures are calculated from live mock data stored in this browser."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="Total zones" value={zones.length} icon={MapPinned} tone="blue" />
        <StatCard title="Total tables" value={tables.length} icon={Armchair} tone="slate" />
        <StatCard title="Categories" value={categories.length} icon={Tags} tone="blue" />
        <StatCard title="Menu items" value={menuItems.length} icon={ShoppingBasket} tone="green" />
        <StatCard title="Ingredients" value={ingredients.length} icon={Leaf} tone="slate" />
        <StatCard title="Low stock items" value={lowStock.length} icon={TriangleAlert} tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Add Zone", path: "/dashboard/zones", target: "zone" as const, icon: MapPinned },
              { label: "Add Table", path: "/dashboard/tables", target: "table" as const, icon: Armchair },
              { label: "Add Category", path: "/dashboard/categories", target: "category" as const, icon: Tags },
              { label: "Add Ingredient", path: "/dashboard/ingredients", target: "ingredient" as const, icon: Leaf },
              { label: "Add Menu Item", path: "/dashboard/menu-items", target: "menu-item" as const, icon: ShoppingBasket },
              { label: "Add Order", path: "/dashboard/orders", target: "order" as const, icon: ClipboardList },
              { label: "Add Inventory Item", path: "/dashboard/inventory", target: "inventory" as const, icon: Boxes },
              { label: "Add Employee", path: "/dashboard/payroll/employees", target: "employee" as const, icon: Users },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-11 justify-start"
                onClick={() => goCreate(action.path, action.target)}
              >
                <Plus />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2 text-sm">
              {chartData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="size-2.5 rounded-full" style={{ background: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recently added menu items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentItems.map((item) => {
              const category = categories.find((row) => row.id === item.categoryId);
              return (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">{category?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-700">{formatMUR(item.price)}</span>
                    <StatusBadge
                      active={item.isAvailable}
                      activeLabel="Available"
                      inactiveLabel="Unavailable"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...lowStock, ...outOfStock].length === 0 ? (
              <p className="text-sm text-slate-500">All tracked ingredients are above minimum levels.</p>
            ) : (
              [...lowStock, ...outOfStock].slice(0, 6).map((item) => {
                const ingredient = ingredients.find((row) => row.id === item.ingredientId);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{ingredient?.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.currentStock} {unitAbbreviation(units, ingredient?.unitId)} / min{" "}
                        {item.minimumStock}
                      </p>
                    </div>
                    <InventoryStatusBadge status={getStockStatus(item)} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Tables by zone</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tablesByZone.map(({ zone, count }) => (
            <div key={zone.id} className="rounded-xl border bg-slate-50 px-4 py-3">
              <p className="font-medium">{zone.name}</p>
              <p className="mt-1 text-2xl font-semibold">{count}</p>
              <p className="text-xs text-slate-500">tables assigned</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
