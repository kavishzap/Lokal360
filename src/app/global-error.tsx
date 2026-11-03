"use client";

import { useEffect } from "react";
import "./globals.css";
import { StatusScreen } from "@/components/shared/status-screen";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <StatusScreen
          code="500"
          title="Something went wrong"
          description="This page could not be opened. Your books are unchanged."
        >
          <Button onClick={() => retry()}>Try again</Button>
        </StatusScreen>
      </body>
    </html>
  );
}
