"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StatusScreen } from "@/components/shared/status-screen";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const reference = error instanceof Error && "digest" in error ? String(error.digest ?? "") : "";

  return (
    <StatusScreen
      code="500"
      title="Something went wrong"
      description="This page could not be opened. Your books are unchanged."
    >
      {reference ? <p className="w-full text-xs text-slate-400">Reference {reference}</p> : null}
      <Button onClick={() => retry()}>Try again</Button>
      <Button nativeButton={false} variant="outline" render={<Link href="/dashboard" />}>
        Back to the office
      </Button>
    </StatusScreen>
  );
}
