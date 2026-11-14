"use client";

import { Printer } from "lucide-react";
import { FormModal } from "@/components/shared/form-modal";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/i18n/use-translate";
import { invoiceLineNet, invoiceLineVat, invoiceTotals } from "@/lib/accounting";
import { formatDate, formatMUR } from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import type { Invoice } from "@/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const STATUS_LABEL = {
  draft: "Draft",
  issued: "Issued",
  partial: "Part paid",
  paid: "Paid",
  void: "Void",
} as const;

export function InvoicePreview({
  invoice,
  onOpenChange,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslate();
  const company = useAppStore((state) => state.company);

  const print = () => {
    if (!invoice || !totals) return;
    const frame = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!frame) return;
    const rows = invoice.lines
      .map(
        (line) => `<tr>
          <td>${escapeHtml(line.description)}<div class="muted">${line.vatRate}%</div></td>
          <td class="right">${line.quantity}</td>
          <td class="right">${formatMUR(line.unitPrice)}</td>
          <td class="right">${formatMUR(invoiceLineVat(line))}</td>
          <td class="right">${formatMUR(invoiceLineNet(line) + invoiceLineVat(line))}</td>
        </tr>`
      )
      .join("");
    const payments = invoice.payments
      .map(
        (payment) =>
          `<p class="muted">${formatDate(payment.date)} · ${payment.method === "cash" ? t("Cash") : t("Bank")} · ${formatMUR(payment.amount)}${payment.reference ? ` · ${payment.reference}` : ""}</p>`
      )
      .join("");
    frame.document.write(`<!doctype html><html><head><title>${invoice.number}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; color: #0f172a; margin: 32px; }
        h1 { font-size: 28px; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th { text-align: left; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: top; }
        .right { text-align: right; }
        .muted { color: #64748b; font-size: 13px; }
        .totals { margin-left: auto; width: 240px; margin-top: 16px; }
        .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
        .head { display: flex; justify-content: space-between; gap: 24px; }
      </style></head><body>
        <div class="head">
          <div>
            <h1>${escapeHtml(company.legalName || company.name)}</h1>
            <p class="muted">${[company.address, company.city].filter(Boolean).join(", ")}<br>${[company.phone, company.email].filter(Boolean).join(" · ")}<br>${company.vatNumber ? `VAT ${company.vatNumber}` : ""}${company.brn ? ` · BRN ${company.brn}` : ""}</p>
          </div>
          <div class="right">
            <p class="muted">${t("Invoicing")}</p>
            <strong>${invoice.number}</strong>
            <p class="muted">${t("Invoice date")} ${formatDate(invoice.date)}<br>${t("Due date")} ${formatDate(invoice.dueDate)}</p>
          </div>
        </div>
        <p class="muted">${t("Bill to")}</p>
        <p><strong>${escapeHtml(invoice.customerName)}</strong><br><span class="muted">${escapeHtml(invoice.customerPhone)}${invoice.billTo ? `<br>${escapeHtml(invoice.billTo)}` : ""}</span></p>
        <table>
          <thead><tr><th>${t("Description")}</th><th class="right">${t("Qty")}</th><th class="right">${t("Price")}</th><th class="right">${t("VAT")}</th><th class="right">${t("Total")}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div><span>${t("Net")}</span><span>${formatMUR(totals.net)}</span></div>
          <div><span>${t("VAT")}</span><span>${formatMUR(totals.vat)}</span></div>
          <div><strong>${t("Total")}</strong><strong>${formatMUR(totals.gross)}</strong></div>
          <div><span>${t("Paid")}</span><span>${formatMUR(totals.paid)}</span></div>
          <div><strong>${t("Balance")}</strong><strong>${formatMUR(totals.balance)}</strong></div>
        </div>
        ${payments}
        ${invoice.notes ? `<p>${escapeHtml(invoice.notes)}</p>` : ""}
      </body></html>`);
    frame.document.close();
    frame.focus();
    frame.print();
  };

  const totals = invoice ? invoiceTotals(invoice) : null;

  return (
    <FormModal
      open={Boolean(invoice)}
      onOpenChange={onOpenChange}
      title={invoice?.number ?? "Invoicing"}
      description={invoice ? t(STATUS_LABEL[invoice.status]) : undefined}
      className="sm:max-w-3xl"
    >
      {invoice && totals ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={print}>
              <Printer /> {t("Print")}
            </Button>
          </div>
          <div id="invoice-sheet" className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                {company.logo ? (
                  <img src={company.logo} alt="" className="mb-3 h-12 w-auto object-contain" />
                ) : null}
                <p className="text-2xl font-semibold tracking-tight">{company.legalName || company.name}</p>
                <p className="text-sm text-slate-500">
                  {[company.address, company.city].filter(Boolean).join(", ")}
                  <br />
                  {[company.phone, company.email].filter(Boolean).join(" · ")}
                  <br />
                  {company.vatNumber ? `VAT ${company.vatNumber}` : ""}
                  {company.brn ? ` · BRN ${company.brn}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs tracking-wide text-slate-500 uppercase">{t("Invoicing")}</p>
                <p className="text-lg font-semibold">{invoice.number}</p>
                <p className="text-sm text-slate-500">
                  {t("Invoice date")} {formatDate(invoice.date)}
                  <br />
                  {t("Due date")} {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs tracking-wide text-slate-500 uppercase">{t("Bill to")}</p>
              <p className="font-medium">{invoice.customerName}</p>
              <p className="text-sm text-slate-500">
                {invoice.customerPhone}
                {invoice.billTo ? <><br />{invoice.billTo}</> : null}
              </p>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr>
                  <th>{t("Description")}</th>
                  <th className="text-right">{t("Qty")}</th>
                  <th className="text-right">{t("Price")}</th>
                  <th className="text-right">{t("VAT")}</th>
                  <th className="text-right">{t("Total")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      {line.description}
                      <div className="text-xs text-slate-500">{line.vatRate}%</div>
                    </td>
                    <td className="text-right">{line.quantity}</td>
                    <td className="text-right">{formatMUR(line.unitPrice)}</td>
                    <td className="text-right">{formatMUR(invoiceLineVat(line))}</td>
                    <td className="text-right">{formatMUR(invoiceLineNet(line) + invoiceLineVat(line))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 ml-auto w-60 space-y-1 text-sm">
              <div className="flex justify-between"><span>{t("Net")}</span><span>{formatMUR(totals.net)}</span></div>
              <div className="flex justify-between"><span>{t("VAT")}</span><span>{formatMUR(totals.vat)}</span></div>
              <div className="flex justify-between"><strong>{t("Total")}</strong><strong>{formatMUR(totals.gross)}</strong></div>
              <div className="flex justify-between"><span>{t("Paid")}</span><span>{formatMUR(totals.paid)}</span></div>
              <div className="flex justify-between"><strong>{t("Balance")}</strong><strong>{formatMUR(totals.balance)}</strong></div>
            </div>
            {invoice.payments.length ? (
              <div className="mt-4">
                <p className="text-xs tracking-wide text-slate-500 uppercase">{t("Record payment")}</p>
                {invoice.payments.map((payment) => (
                  <p key={payment.id} className="text-sm text-slate-500">
                    {formatDate(payment.date)} · {payment.method === "cash" ? t("Cash") : t("Bank")} · {formatMUR(payment.amount)}
                    {payment.reference ? ` · ${payment.reference}` : ""}
                    {invoice.status === "void" ? ` · ${t("Void")}` : ""}
                  </p>
                ))}
              </div>
            ) : null}
            {invoice.notes ? <p className="mt-4 text-sm">{invoice.notes}</p> : null}
          </div>
        </div>
      ) : null}
    </FormModal>
  );
}
