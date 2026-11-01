"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { APP_NAME, DEMO_CREDENTIALS } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = (values: Values) => {
    const result = login(values.email, values.password, values.rememberMe);
    if (result) {
      setError(result);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0F172A] text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_40%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 font-semibold">
              B42
            </div>
            <div>
              <p className="font-semibold">{APP_NAME}</p>
              <p className="text-sm text-slate-400">Back office</p>
            </div>
          </div>
          <div className="max-w-md">
            <p className="text-sm font-medium tracking-[0.2em] text-blue-300 uppercase">
              Restaurant operations
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Run the floor, the menu and the storeroom from one place.
            </h1>
            <p className="mt-4 text-slate-300">
              Manage dining zones, tables, recipes and inventory with a polished back-office
              workspace built for Mauritian restaurants.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-slate-300">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Zones, tables and seating setup
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Menu categories, recipes and pricing in MUR
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Ingredient inventory with low-stock alerts
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">Demo authentication only. No production backend.</p>
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
              <p className="text-sm text-slate-500">Back office</p>
            </div>
          </div>
          <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <UtensilsCrossed className="size-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Use the demo administrator account to explore the prototype.</p>

          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email address</label>
              <Input type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? (
                <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
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
              Remember me
            </label>
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <Button type="submit" className="h-10 w-full">
              Login
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Demo credentials</p>
            <p>Email: {DEMO_CREDENTIALS.email}</p>
            <p>Password: {DEMO_CREDENTIALS.password}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
