"use client";

import { useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/i18n/use-translate";
import { storeroomWatch, weekAhead, whatSells } from "@/lib/ai-analytics";
import { formatMUR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const CONFIDENCE = {
  thin: "Thin read",
  fair: "Fair read",
  strong: "Strong read",
} as const;

type Plan = "month" | "year" | "life";

const PAID = [
  {
    id: "ask",
    name: "Ask the books",
    kin: "The question model operators pay for in ThoughtSpot and Tableau.",
    promise: "Ask in plain language why a Saturday was quiet, which table carried the week, or whether wages outran food sales. It answers from orders, stock, payroll and the journal.",
    preview: "“Why did Monday takings sit under the wage bill?”",
    prices: { month: 1490, year: 14900, life: 39000 },
  },
  {
    id: "menu",
    name: "Price the menu",
    kin: "The menu-engineering model sold by Avero and Fourth.",
    promise: "It splits every dish into star, puzzle, plowhorse or dog from popularity and recipe cost, then names the price to try next.",
    preview: "A quiet steak with a high food cost is a puzzle. A busy burger with room in the margin is a star.",
    prices: { month: 2490, year: 24900, life: 64000 },
  },
  {
    id: "guest",
    name: "Guest ear",
    kin: "The reputation model sold by Tattle and Chatmeter.",
    promise: "It groups reviews and table notes into the three complaints to fix this week, and drafts the reply in your voice.",
    preview: "“Slow mains on the terrace” showed up four times. The draft reply apologises and offers the next dessert.",
    prices: { month: 1990, year: 19900, life: 52000 },
  },
] as const;

const PLAN_LABEL: Record<Plan, string> = {
  month: "Monthly",
  year: "Yearly",
  life: "Lifetime",
};

export default function AiAnalyticsPage() {
  const orders = useAppStore((state) => state.orders);
  const menuItems = useAppStore((state) => state.menuItems);
  const ingredients = useAppStore((state) => state.ingredients);
  const units = useAppStore((state) => state.units);
  const inventory = useAppStore((state) => state.inventory);
  const [chosen, setChosen] = useState<Record<string, Plan>>({});
  const { t } = useTranslate();

  const week = useMemo(() => weekAhead(orders), [orders]);
  const dishes = useMemo(() => whatSells(orders), [orders]);
  const stock = useMemo(
    () => storeroomWatch(orders, menuItems, ingredients, units, inventory),
    [orders, menuItems, ingredients, units, inventory]
  );

  const choose = (id: string, name: string, plan: Plan, amount: number) => {
    setChosen((current) => ({ ...current, [id]: plan }));
    toast(`${name} · ${PLAN_LABEL[plan]} is ${formatMUR(amount)}. Checkout is not switched on in this demo.`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="AI Analytics"
        description="Three readings from the tickets already in this browser. Three stronger models you can switch on."
      />

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-blue-700" />
          <h2 className="text-sm font-semibold text-slate-900">{t("Included")}</h2>
          <span className="text-xs text-slate-500">{t("Free · runs on your own books")}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium tracking-wide text-blue-700 uppercase">{t("Week ahead")}</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{week.headline}</p>
            <p className="mt-2 text-xs text-slate-500">{week.detail}</p>
            <p className="mt-3 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {t(CONFIDENCE[week.confidence])}
            </p>
            {week.days.length > 0 ? (
              <ul className="mt-4 space-y-1.5">
                {week.days.map((day) => (
                  <li key={day.date} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-600">
                      {day.label}
                      {day.basis === "guess" ? <span className="text-slate-400"> · guess</span> : null}
                    </span>
                    <span className="font-medium text-slate-900">{formatMUR(day.sales)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium tracking-wide text-blue-700 uppercase">{t("Next service")}</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{dishes.headline}</p>
            <p className="mt-2 text-xs text-slate-500">{dishes.detail}</p>
            {dishes.dishes.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {dishes.dishes.map((dish) => (
                  <li key={dish.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-900">{dish.name}</span>
                      <span className="text-slate-500">{dish.quantity.toFixed(1)} / service</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(dish.share * 100, 6)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium tracking-wide text-blue-700 uppercase">{t("Storeroom")}</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{stock.headline}</p>
            <p className="mt-2 text-xs text-slate-500">{stock.detail}</p>
            {stock.rows.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {stock.rows.map((row) => (
                  <li key={row.name}>
                    <p className="text-sm font-medium text-slate-900">
                      {row.name}
                      <span className="font-normal text-slate-500">
                        {" "}
                        · {row.onHand} {row.unit}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">{row.note}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="size-4 text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">{t("Worth paying for")}</h2>
          <span className="text-xs text-slate-500">{t("One restaurant · yearly is ten months · lifetime does not renew")}</span>
        </div>
        <div className="grid gap-4">
          {PAID.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="bg-[#0F172A] px-4 py-4 text-white">
                <p className="text-xs text-blue-200">{product.kin}</p>
                <h3 className="mt-1 text-lg font-semibold">{t(product.name)}</h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">{product.promise}</p>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-[1.2fr_1fr] lg:items-end">
                <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">{product.preview}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["month", "year", "life"] as const).map((plan) => {
                    const selected = chosen[product.id] === plan;
                    return (
                      <Button
                        key={plan}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className={cn("h-auto flex-col gap-0.5 px-2 py-2", selected && "bg-blue-600 text-white hover:bg-blue-600")}
                        onClick={() => choose(product.id, product.name, plan, product.prices[plan])}
                      >
                        <span className="text-[11px] font-medium tracking-wide uppercase">{t(PLAN_LABEL[plan])}</span>
                        <span className="text-sm font-semibold">{formatMUR(product.prices[plan])}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
