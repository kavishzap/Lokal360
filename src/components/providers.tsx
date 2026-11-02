"use client";

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useLocaleStore } from "@/store/locale-store";
import { hydrateUiStore } from "@/store/ui-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void (async () => {
      await useAuthStore.getState().hydrate();
      await useAppStore.getState().hydrate();
      useLocaleStore.getState().hydrate();
      hydrateUiStore();
    })();
  }, []);

  return (
    <TooltipProvider delay={200}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
