"use client";

import { notFound, useRouter } from "next/navigation";
import { use } from "react";
import { InvoiceForm } from "@/components/accounting/invoice-form";
import { StatusScreen } from "@/components/shared/status-screen";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/i18n/use-translate";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslate();
  const router = useRouter();
  const hydrated = useAppStore((state) => state.hydrated);
  const invoicesLoaded = useAppStore((state) => state.loadedSlices.includes("invoices"));
  const invoice = useAppStore((state) => state.invoices.find((row) => row.id === id));

  if (!hydrated) return null;
  if (isSupabaseConfigured() && !invoicesLoaded) {
    return (
      <StatusScreen
        embedded
        title="This page could not be loaded."
        description="This page could not be opened. Your books are unchanged."
      />
    );
  }
  if (!invoice) notFound();
  if (invoice.status !== "draft") {
    return (
      <StatusScreen
        embedded
        title="Edit invoice"
        description="This invoice has already been issued."
      >
        <Button onClick={() => router.push("/dashboard/invoices")}>{t("Invoicing")}</Button>
      </StatusScreen>
    );
  }

  return <InvoiceForm invoice={invoice} />;
}
