"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, DEMO_CREDENTIALS, STORAGE_KEY } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

export default function SettingsPage() {
  const session = useAuthStore((state) => state.session);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Demo workspace preferences. Authentication and data are stored locally in this browser."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Restaurant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={APP_NAME} />
            <Row label="Currency" value="Mauritian Rupee (MUR / Rs)" />
            <Row label="Phase" value="Frontend prototype — no backend connected" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signed-in user</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={session?.name ?? "—"} />
            <Row label="Email" value={session?.email ?? "—"} />
            <Row label="Role" value={session?.role ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-slate-500">
              This login is local only. It is not JWT-based and should not be used in production.
            </p>
            <Row label="Email" value={DEMO_CREDENTIALS.email} />
            <Row label="Password" value={DEMO_CREDENTIALS.password} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-slate-500">
              All changes are saved under the versioned key <code>{STORAGE_KEY}</code>. Resetting
              restores the original restaurant seed data and cannot be undone.
            </p>
            <Button variant="destructive" onClick={() => setConfirmReset(true)}>
              Reset demo data
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="This replaces all local zones, tables, menu and inventory changes with the original B42 Bistro seed data."
        confirmLabel="Reset data"
        onConfirm={() => {
          resetDemo();
          setConfirmReset(false);
          toast.success("Demo data restored");
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}
