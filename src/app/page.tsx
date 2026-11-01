"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "@/components/shared/loading-skeleton";
import { useAuthStore } from "@/store/auth-store";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(session ? (session.role === "Staff" ? "/dashboard/me" : "/dashboard") : "/login");
  }, [hydrated, session, router]);

  return <PageSpinner />;
}
