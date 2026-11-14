"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { GridStage } from "@/components/layout/grid-stage";
import { LoadingSkeleton, OfficeLoading, PageSpinner } from "@/components/shared/loading-skeleton";
import { slicesForPath } from "@/lib/data-slices";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const appHydrated = useAppStore((state) => state.hydrated);
  const staff = session?.role === "Staff";
  const loadedSlices = useAppStore((state) => state.loadedSlices);
  const needed = slicesForPath(pathname, staff);
  const pageReady = !isSupabaseConfigured() || needed.every((slice) => loadedSlices.includes(slice));
  const [settledPath, setSettledPath] = useState<string | null>(null);

  useEffect(() => {
    if (authHydrated && !session) router.replace("/login");
  }, [authHydrated, session, router]);

  useEffect(() => {
    if (!session) return;
    if (pathname === "/dashboard/ai-analytics" || pathname.startsWith("/dashboard/ai-analytics/")) {
      router.replace(staff ? "/dashboard/me" : "/dashboard");
      return;
    }
    if (staff && pathname !== "/dashboard/me") router.replace("/dashboard/me");
    if (!staff && pathname === "/dashboard/me") router.replace("/dashboard");
  }, [session, staff, pathname, router]);

  useEffect(() => {
    if (!authHydrated || !session || !isSupabaseConfigured()) return;
    let cancel = false;
    void useAppStore
      .getState()
      .ensureSlices(slicesForPath(pathname, session.role === "Staff"))
      .catch(() => {
        if (!cancel) toast.error("Some of this page could not be loaded.");
      })
      .finally(() => {
        if (!cancel) setSettledPath(pathname);
      });
    return () => {
      cancel = true;
    };
  }, [authHydrated, pathname, session]);

  if (!authHydrated || !appHydrated || !session || (staff && pathname !== "/dashboard/me")) {
    return <OfficeLoading />;
  }

  if (staff) {
    return (
      <GridStage>
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6">
          {pageReady || settledPath === pathname ? children : <LoadingSkeleton variant="page" />}
        </main>
      </GridStage>
    );
  }

  return (
    <GridStage>
      <AppHeader />
      <main className="px-4 py-6 lg:px-6">
        {pathname === "/dashboard/ai-analytics" || pathname.startsWith("/dashboard/ai-analytics/") ? (
          <PageSpinner />
        ) : pageReady || settledPath === pathname ? (
          children
        ) : (
          <LoadingSkeleton variant={pathname === "/dashboard" ? "board" : "page"} />
        )}
      </main>
    </GridStage>
  );
}
