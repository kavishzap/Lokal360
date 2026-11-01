"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslate } from "@/i18n/use-translate";
import { accountBalance, accountByCode, SYSTEM_ACCOUNT_CODES } from "@/lib/accounting";
import { formatMUR } from "@/lib/format";
import {
  employeeName,
  incomeYearLabel,
  mraReturnCsv,
  payrollTotals,
  salaryPaymentCsv,
} from "@/lib/payroll";
import { useAppStore } from "@/store/app-store";

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function done(ok: boolean) {
  return ok ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500";
}

export default function PayAndFilePage() {
  const { t } = useTranslate();
  const employees = useAppStore((state) => state.employees);
  const payslips = useAppStore((state) => state.payslips);
  const runs = useAppStore((state) => state.payrollRuns);
  const accounts = useAppStore((state) => state.accounts);
  const journals = useAppStore((state) => state.journalEntries);
  const company = useAppStore((state) => state.company);
  const generatePayslips = useAppStore((state) => state.generatePayslips);
  const postPayroll = useAppStore((state) => state.postPayroll);
  const paySalaries = useAppStore((state) => state.paySalaries);
  const filePayroll = useAppStore((state) => state.filePayroll);
  const remitPayroll = useAppStore((state) => state.remitPayroll);
  const undoPayrollPost = useAppStore((state) => state.undoPayrollPost);
  const undoSalaryPayment = useAppStore((state) => state.undoSalaryPayment);
  const undoPayrollFiling = useAppStore((state) => state.undoPayrollFiling);
  const undoRemittance = useAppStore((state) => state.undoRemittance);

  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payReference, setPayReference] = useState("");
  const [fileDate, setFileDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fileReference, setFileReference] = useState("");
  const [remitDate, setRemitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remitReference, setRemitReference] = useState("");

  const slips = useMemo(
    () => payslips.filter((slip) => slip.period === period),
    [payslips, period]
  );
  const run = runs.find((row) => row.period === period);
  const totals = payrollTotals(slips);
  const bank = accountByCode(accounts, SYSTEM_ACCOUNT_CODES.bank);
  const bankBalance = bank ? accountBalance(bank, journals).balance : 0;
  const rows = slips
    .map((slip) => {
      const employee = employees.find((row) => row.id === slip.employeeId);
      return { slip, employee };
    })
    .sort((a, b) =>
      employeeName(a.employee ?? { firstName: "", lastName: "" }).localeCompare(
        employeeName(b.employee ?? { firstName: "", lastName: "" })
      )
    );
  const missingBank = rows.filter(
    (row) => row.employee && (!row.employee.bankName.trim() || !row.employee.bankAccount.trim())
  );
  const missingNid = rows.filter((row) => row.employee && !row.employee.nid.trim());

  const act = (result: { ok: boolean; error?: string; warning?: string }) => {
    if (!result.ok) toast.error(result.error);
    else toast.success(result.warning ?? t("Saved"));
  };

  const salaryFile = () => {
    if (!company.tan.trim()) {
      toast.error(t("Add the company TAN in Settings before you file."));
      return;
    }
    if (missingBank.length) {
      toast.error(t("Every person needs a bank and an account number."));
      return;
    }
    download(
      `b42-salaries-${period}.csv`,
      salaryPaymentCsv({
        employer: company.legalName || company.name,
        tan: company.tan,
        period,
        reference: payReference || `SAL-${period}`,
        rows: rows.flatMap((row) =>
          row.employee
            ? [
                {
                  number: row.employee.employeeNumber,
                  name: employeeName(row.employee),
                  bank: row.employee.bankName,
                  bankCode: row.employee.bankCode,
                  account: row.employee.bankAccount,
                  amount: row.slip.net,
                },
              ]
            : []
        ),
      })
    );
  };

  const returnFile = () => {
    if (!company.tan.trim()) {
      toast.error(t("Add the company TAN in Settings before you file."));
      return;
    }
    download(
      `b42-mra-return-${period}.csv`,
      mraReturnCsv({
        legalName: company.legalName || company.name,
        tan: company.tan,
        brn: company.brn,
        period,
        rows: rows.flatMap((row) =>
          row.employee
            ? [
                {
                  nid: row.employee.nid,
                  surname: row.employee.lastName,
                  otherNames: row.employee.firstName,
                  emoluments: row.slip.gross,
                  paye: row.slip.paye,
                  csgEmployee: row.slip.csgEmployee,
                  csgEmployer: row.slip.csgEmployer,
                  nsfEmployee: row.slip.nsfEmployee,
                  nsfEmployer: row.slip.nsfEmployer,
                  hrdc: row.slip.hrdcLevy,
                  prgf: row.slip.prgf,
                },
              ]
            : []
        ),
      })
    );
  };

  return (
    <div>
      <PageHeader
        title="Pay and file"
        description="Calculate the month, post it into the books, pay net salaries from the bank, and prepare the monthly MRA return for PAYE, CSG, NSF, HRDC and PRGF."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 sm:w-48" />
        <p className="text-sm text-slate-500">
          {t("Income year")} {incomeYearLabel(period)} · {t("TAN")} {company.tan || "—"}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-xs font-medium">
        <span className={`rounded-full px-3 py-1 ${done(slips.length > 0)}`}>{t("Calculated")}</span>
        <span className={`rounded-full px-3 py-1 ${done(Boolean(run?.journalEntryId))}`}>{t("In the books")}</span>
        <span className={`rounded-full px-3 py-1 ${done(Boolean(run?.paymentJournalId))}`}>{t("Salaries paid")}</span>
        <span className={`rounded-full px-3 py-1 ${done(Boolean(run?.filedOn))}`}>{t("Return filed")}</span>
        <span className={`rounded-full px-3 py-1 ${done(Boolean(run?.remittanceJournalId))}`}>{t("Remitted")}</span>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Net to pay" value={formatMUR(totals.net)} icon={Landmark} tone="green" />
        <StatCard title="PAYE" value={formatMUR(totals.paye)} icon={Landmark} />
        <StatCard title="Send to the MRA" value={formatMUR(totals.remittance)} icon={Landmark} tone="amber" />
        <StatCard title="Bank now" value={formatMUR(bankBalance)} icon={Landmark} />
      </div>

      {slips.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">
            {t("No slips for this month yet. Calculating uses attendance, leave and the cumulative PAYE table.")}
          </p>
          <Button className="mt-4" onClick={() => act(generatePayslips(period))}>
            {t("Calculate this month")}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">{t("Employee")}</th>
                  <th className="px-4 py-3">{t("Bank")}</th>
                  <th className="px-4 py-3 text-right">{t("Gross")}</th>
                  <th className="px-4 py-3 text-right">{t("PAYE")}</th>
                  <th className="px-4 py-3 text-right">{t("Net")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slip.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {row.employee ? employeeName(row.employee) : t("Unknown")}
                      </p>
                      <p className="text-xs text-slate-500">{row.employee?.nid || t("NID missing")}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.employee?.bankName || "—"}
                      <span className="block text-xs">{row.employee?.bankAccount || t("Account missing")}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatMUR(row.slip.gross)}</td>
                    <td className="px-4 py-3 text-right">{formatMUR(row.slip.paye)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMUR(row.slip.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500">
            {t(
              "PAYE follows the MRA cumulative method from July. A month with no slip is taken at basic salary. Months at or under Rs 38,462 have no PAYE. Employer cost this month is"
            )}{" "}
            {formatMUR(totals.employerCost)}. {t("CSG")} {formatMUR(totals.csgPayable)} · {t("NSF")}{" "}
            {formatMUR(totals.nsfPayable)} · {t("HRDC")} {formatMUR(totals.hrdc)} · {t("PRGF")} {formatMUR(totals.prgf)}.
          </p>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">{t("1. Books")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {t("Posts wages, employer contributions and the amounts you owe the staff and the MRA.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {run?.journalEntryId ? (
                <Button variant="outline" onClick={() => act(undoPayrollPost(period))}>
                  {t("Undo posting")}
                </Button>
              ) : (
                <>
                  <Button onClick={() => act(postPayroll(period))}>{t("Post to the books")}</Button>
                  <Button variant="outline" onClick={() => act(generatePayslips(period))}>
                    {t("Calculate again")}
                  </Button>
                </>
              )}
              {run?.journalEntryId ? (
                <Link href="/dashboard/journal" className="self-center text-sm text-blue-700">
                  {t("Open the journal")}
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">{t("2. Pay salaries")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {t("Downloads a bank file and records the payment against the bank account. The bank balance above is what the books hold now.")}
            </p>
            {missingBank.length ? (
              <p className="mt-2 text-sm text-amber-700">
                {t("Missing bank details")}: {missingBank.map((row) => (row.employee ? employeeName(row.employee) : "")).join(", ")}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input type="date" value={payDate} onChange={(event) => setPayDate(event.target.value)} className="h-9 sm:w-44" />
              <Input
                value={payReference}
                onChange={(event) => setPayReference(event.target.value)}
                placeholder={t("Bank reference")}
                className="h-9 sm:max-w-xs"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={salaryFile}>
                {t("Download salary file")}
              </Button>
              {run?.paymentJournalId ? (
                <Button variant="outline" onClick={() => act(undoSalaryPayment(period))}>
                  {t("Undo salary payment")}
                </Button>
              ) : (
                <Button onClick={() => act(paySalaries(period, payDate, payReference || `SAL-${period}`))}>
                  {t("Record salary payment")}
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">{t("3. MRA return")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {t("The file is the monthly pack for MRA e-services: NID, emoluments, PAYE, CSG, NSF, HRDC and PRGF. Nothing is sent to the MRA from this browser.")}
            </p>
            {missingNid.length ? (
              <p className="mt-2 text-sm text-amber-700">
                {t("NID missing")}: {missingNid.map((row) => (row.employee ? employeeName(row.employee) : "")).join(", ")}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input type="date" value={fileDate} onChange={(event) => setFileDate(event.target.value)} className="h-9 sm:w-44" />
              <Input
                value={fileReference}
                onChange={(event) => setFileReference(event.target.value)}
                placeholder={t("MRA acknowledgement")}
                className="h-9 sm:max-w-xs"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={returnFile}>
                {t("Download MRA return")}
              </Button>
              {run?.filedOn ? (
                <Button variant="outline" onClick={() => act(undoPayrollFiling(period))}>
                  {t("Undo filing")}
                </Button>
              ) : (
                <Button onClick={() => act(filePayroll(period, fileDate, fileReference))}>
                  {t("Mark return filed")}
                </Button>
              )}
            </div>
            {run?.filedOn ? (
              <p className="mt-3 text-sm text-slate-600">
                {t("Filed")} {run.filedOn} · {run.filingReference}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">{t("4. Remit to the MRA")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {t("Pays the PAYE, CSG, NSF, HRDC and PRGF liabilities from the bank. Do this after the return is filed.")}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input type="date" value={remitDate} onChange={(event) => setRemitDate(event.target.value)} className="h-9 sm:w-44" />
              <Input
                value={remitReference}
                onChange={(event) => setRemitReference(event.target.value)}
                placeholder={t("Payment reference")}
                className="h-9 sm:max-w-xs"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {run?.remittanceJournalId ? (
                <Button variant="outline" onClick={() => act(undoRemittance(period))}>
                  {t("Undo remittance")}
                </Button>
              ) : (
                <Button onClick={() => act(remitPayroll(period, remitDate, remitReference || `MRA-${period}`))}>
                  {t("Remit from the bank")}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
