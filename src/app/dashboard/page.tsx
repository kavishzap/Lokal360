"use client";

import { ModuleBoard } from "@/components/layout/module-board";
import { useTranslate } from "@/i18n/use-translate";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardPage() {
  const session = useAuthStore((state) => state.session);
  const { locale } = useTranslate();
  const hello = locale === "fr" ? "Bonjour" : locale === "mfe" ? "Bonzour" : "Hello";
  const firstName = session?.name.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {hello}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </div>
      <ModuleBoard />
    </div>
  );
}
