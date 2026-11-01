"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PageSpinner } from "@/components/shared/loading-skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const appHydrated = useAppStore((state) => state.hydrated);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  const staff = session?.role === "Staff";

  useEffect(() => {
    if (authHydrated && !session) router.replace("/login");
  }, [authHydrated, session, router]);

  useEffect(() => {
    if (!session) return;
    if (staff && pathname !== "/dashboard/me") router.replace("/dashboard/me");
    if (!staff && pathname === "/dashboard/me") router.replace("/dashboard");
  }, [session, staff, pathname, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  if (!authHydrated || !appHydrated || !session || (staff && pathname !== "/dashboard/me")) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageSpinner />
      </div>
    );
  }

  if (staff) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden overflow-hidden transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-[260px]"
        )}
      >
        <AppSidebar />
      </aside>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] border-0 p-0 sm:max-w-[280px]" showCloseButton={false}>
          <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]")}>
        <AppHeader />
        <main className="px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
