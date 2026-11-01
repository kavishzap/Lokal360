"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/form-modal";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslate } from "@/i18n/use-translate";
import { companyInitials } from "@/lib/company";
import { DEMO_CREDENTIALS, STORAGE_KEY } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  legalName: z.string(),
  brn: z.string(),
  vatNumber: z.string(),
  tan: z.string(),
  address: z.string(),
  city: z.string(),
  phone: z.string(),
  email: z.string().trim().refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: "Enter a valid email address",
  }),
  website: z.string(),
  logo: z.string().nullable(),
});

type Values = z.infer<typeof schema>;

export default function SettingsPage() {
  const session = useAuthStore((state) => state.session);
  const company = useAppStore((state) => state.company);
  const updateCompany = useAppStore((state) => state.updateCompany);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const [confirmReset, setConfirmReset] = useState(false);
  const { t } = useTranslate();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: company,
  });

  const logo = form.watch("logo");

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > 2_000_000) {
      toast.error("Use an image under 2 MB");
      return;
    }
    try {
      form.setValue("logo", await shrinkLogo(file), { shouldDirty: true });
    } catch {
      toast.error("That image could not be read");
    }
  };

  const onSubmit = (values: Values) => {
    const result = updateCompany(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Company details saved");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Settings"
        description="Company details used on the sidebar and on reports. Everything stays in this browser."
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t("Company")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-sm font-semibold text-white">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" className="size-full object-cover" />
                ) : (
                  companyInitials(form.watch("name") || "B42")
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {t("Upload logo")}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      void onLogo(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                {logo ? (
                  <Button type="button" variant="outline" onClick={() => form.setValue("logo", null, { shouldDirty: true })}>
                    {t("Remove logo")}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Trading name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} placeholder="B42 Bistro" />
              </Field>
              <Field label="Legal name" error={form.formState.errors.legalName?.message}>
                <Input {...form.register("legalName")} placeholder="B42 Bistro Ltd" />
              </Field>
              <Field label="BRN" error={form.formState.errors.brn?.message}>
                <Input {...form.register("brn")} placeholder="C18123456" />
              </Field>
              <Field label="VAT number" error={form.formState.errors.vatNumber?.message}>
                <Input {...form.register("vatNumber")} placeholder="VAT20345678" />
              </Field>
              <Field label="TAN" error={form.formState.errors.tan?.message}>
                <Input {...form.register("tan")} placeholder="Tax account number" />
              </Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}>
                <Input {...form.register("phone")} placeholder="+230 263 4200" />
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" {...form.register("email")} placeholder="hello@b42bistro.mu" />
              </Field>
              <Field label="Website" error={form.formState.errors.website?.message}>
                <Input {...form.register("website")} placeholder="https://b42bistro.mu" />
              </Field>
              <Field label="City" error={form.formState.errors.city?.message}>
                <Input {...form.register("city")} placeholder="Grand Baie" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address" error={form.formState.errors.address?.message}>
                  <Textarea {...form.register("address")} placeholder="Royal Road" rows={2} />
                </Field>
              </div>
            </div>

            <Button type="submit">{t("Save company")}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("Signed-in user")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t("Name")} value={session?.name ?? "—"} />
            <Row label={t("Email")} value={session?.email ?? "—"} />
            <Row label={t("Role")} value={session?.role ? t(session.role) : "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("Demo authentication")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-slate-500">
              {t("This login is local only. It is not JWT-based and should not be used in production.")}
            </p>
            <Row label={t("Email")} value={DEMO_CREDENTIALS.email} />
            <Row label={t("Password")} value={DEMO_CREDENTIALS.password} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("Demo data")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-slate-500">
              All changes are saved under the versioned key <code>{STORAGE_KEY}</code>. Resetting
              restores the original restaurant seed data, including these company details, and cannot be undone.
            </p>
            <Button variant="destructive" onClick={() => setConfirmReset(true)}>
              {t("Reset demo data")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset demo data?"
        description="This replaces all local zones, tables, menu, inventory and company details with the original B42 Bistro seed data."
        confirmLabel="Reset data"
        onConfirm={() => {
          resetDemo();
          form.reset(useAppStore.getState().company);
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

function shrinkLogo(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const max = 256;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    image.src = url;
  });
}
