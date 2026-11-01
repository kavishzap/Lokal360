"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Landmark,
  LayoutDashboard,
  Sparkles,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTranslate } from "@/i18n/use-translate";
import { APP_NAME, DEMO_CREDENTIALS } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type Values = z.infer<typeof schema>;

const CARD_DEPTH = [10, -14, 16, -8, 12];

const CAPABILITIES: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: UtensilsCrossed,
    title: "The floor",
    detail: "Zones, tables, orders, recipes and the storeroom.",
  },
  {
    icon: Landmark,
    title: "The books",
    detail: "Purchases, expenses, assets, the journal and the cashbook.",
  },
  {
    icon: LayoutDashboard,
    title: "The owner view",
    detail: "Sales, what is left after costs, and cash and bank.",
  },
  {
    icon: Users,
    title: "Payroll",
    detail: "Staff, leave, attendance and payslips with CSG, NSF, PRGF and PAYE.",
  },
  {
    icon: Sparkles,
    title: "AI Analytics",
    detail: "A week-ahead call, the dishes to push, and what runs out first.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslate();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: DEMO_CREDENTIALS.email,
      password: "",
      rememberMe: true,
    },
  });

  useEffect(() => {
    if (hydrated && session) router.replace("/dashboard");
  }, [hydrated, session, router]);

  const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    event.currentTarget.style.setProperty("--mx", `${x}px`);
    event.currentTarget.style.setProperty("--my", `${y}px`);
    event.currentTarget.style.setProperty("--nx", ((x / rect.width - 0.5) * 2).toFixed(4));
    event.currentTarget.style.setProperty("--ny", ((y / rect.height - 0.5) * 2).toFixed(4));
  };

  const resetPointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--mx", "42%");
    event.currentTarget.style.setProperty("--my", "28%");
    event.currentTarget.style.setProperty("--nx", "0");
    event.currentTarget.style.setProperty("--ny", "0");
  };

  const onSubmit = (values: Values) => {
    const result = login(values.email, values.password, values.rememberMe);
    if (result) {
      setError(result);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <div
        className="login-stage relative hidden overflow-y-auto bg-[#0F172A] text-white lg:flex"
        onPointerMove={trackPointer}
        onPointerLeave={resetPointer}
      >
        <style>{`
          .login-stage {
            --mx: 42%;
            --my: 28%;
            --nx: 0;
            --ny: 0;
          }
          .login-spot {
            background: radial-gradient(440px circle at var(--mx) var(--my), rgba(59, 130, 246, 0.5), transparent 62%);
          }
          .login-grid {
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
            background-size: 46px 46px;
            mask-image: radial-gradient(340px circle at var(--mx) var(--my), #000 0%, transparent 74%);
            -webkit-mask-image: radial-gradient(340px circle at var(--mx) var(--my), #000 0%, transparent 74%);
          }
          .login-shift {
            transform: translate3d(calc(var(--nx) * var(--d) * 1px), calc(var(--ny) * var(--d) * 1px), 0);
            transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          @media (prefers-reduced-motion: reduce) {
            .login-shift { transform: none; transition: none; }
          }
        `}</style>
        <div className="login-spot pointer-events-none absolute inset-0" />
        <div className="login-grid pointer-events-none absolute inset-0" />
        <div className="login-shift pointer-events-none absolute -top-10 -left-16 size-64 rounded-full bg-blue-500/25 blur-3xl" style={{ "--d": 34 } as React.CSSProperties} />
        <div className="login-shift pointer-events-none absolute right-[-4rem] bottom-8 size-72 rounded-full bg-indigo-400/20 blur-3xl" style={{ "--d": -26 } as React.CSSProperties} />
        <div className="relative z-10 flex min-h-full w-full flex-col justify-between gap-8 p-10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 font-semibold">
              B42
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{APP_NAME}</p>
              <p className="text-sm text-slate-400">{t("Back office")}</p>
            </div>
            <LanguageSwitch tone="dark" />
          </div>
          <div className="login-shift max-w-md" style={{ "--d": -12 } as React.CSSProperties}>
            <p className="text-sm font-medium tracking-[0.2em] text-blue-300 uppercase">
              {t("Restaurant back office")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {t("The floor, the books and the wage bill in one place.")}
            </h1>
            <p className="mt-4 text-slate-300">
              {t(
                "Built for a Mauritian restaurant: tickets in rupees, Workers' Rights Act leave, and the figures an owner checks before service."
              )}
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {CAPABILITIES.map((item, index) => (
                <div
                  key={item.title}
                  className="login-shift flex gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5"
                  style={{ "--d": CARD_DEPTH[index] } as React.CSSProperties}
                >
                  <item.icon className="mt-0.5 size-4 shrink-0 text-blue-300" />
                  <div>
                    <p className="text-sm font-medium text-white">{t(item.title)}</p>
                    <p className="text-sm text-slate-300">{t(item.detail)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">{t("Demo authentication only. No production backend.")}</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 font-semibold text-white">
              B42
            </div>
            <div>
              <p className="font-semibold">{APP_NAME}</p>
              <p className="text-sm text-slate-500">{t("Back office")}</p>
            </div>
          </div>
          <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <UtensilsCrossed className="size-5" />
          </div>
          <div className="mb-6 space-y-2 lg:hidden">
            <p className="text-sm font-medium text-slate-800">{t("What you can run from here")}</p>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {CAPABILITIES.map((item) => (
                <li key={item.title}>
                  <span className="font-medium text-slate-800">{t(item.title)}.</span> {t(item.detail)}
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{t("Sign in")}</h2>
            <LanguageSwitch />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t("Use the demo administrator account to explore the prototype.")}
          </p>

          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("Email address")}</label>
              <Input type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("Password")}</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.password ? (
                <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Controller
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                )}
              />
              {t("Remember me")}
            </label>
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <Button type="submit" className="h-10 w-full">
              {t("Login")}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-800">{t("Demo credentials")}</p>
            <p>Email: {DEMO_CREDENTIALS.email}</p>
            <p>Password: {DEMO_CREDENTIALS.password}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
