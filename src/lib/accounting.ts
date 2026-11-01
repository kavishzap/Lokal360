import type { Account, AccountType, JournalEntry, JournalLine } from "@/types";

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

export const PAYMENT_LABEL: Record<"cash" | "bank" | "credit", string> = {
  cash: "Cash",
  bank: "Bank",
  credit: "On credit",
};

export const SYSTEM_ACCOUNT_CODES = {
  cash: "1000",
  bank: "1010",
  inventory: "1100",
  fixedAssets: "1200",
  accumDep: "1205",
  payable: "2000",
  capital: "3000",
  sales: "4000",
  purchases: "5000",
  expenses: "5100",
  depreciation: "5200",
} as const;

export function isDebitNormal(type: AccountType) {
  return type === "asset" || type === "expense";
}

export function accountByCode(accounts: Account[], code: string) {
  return accounts.find((account) => account.code === code);
}

export function lineAmount(line: { quantity: number; unitCost: number }) {
  return Number((line.quantity * line.unitCost).toFixed(2));
}

export function purchaseTotal(purchase: { lines: { quantity: number; unitCost: number }[] }) {
  return purchase.lines.reduce((sum, line) => sum + lineAmount(line), 0);
}

export function expenseTotal(expense: { lines: { amount: number }[] }) {
  return Number(expense.lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0).toFixed(2));
}

export function journalTotals(lines: Pick<JournalLine, "debit" | "credit">[]) {
  const debit = lines.reduce((sum, line) => sum + (Number.isFinite(line.debit) ? line.debit : 0), 0);
  const credit = lines.reduce((sum, line) => sum + (Number.isFinite(line.credit) ? line.credit : 0), 0);
  return {
    debit: Number(debit.toFixed(2)),
    credit: Number(credit.toFixed(2)),
    balanced: Math.abs(debit - credit) < 0.01 && debit > 0,
  };
}

export function validateJournalLines(lines: JournalLine[]) {
  if (lines.length < 2) return "A journal entry needs at least two lines.";
  if (lines.some((line) => !line.accountId)) return "Every line must have an account.";
  if (lines.some((line) => (line.debit > 0 && line.credit > 0) || (line.debit <= 0 && line.credit <= 0))) {
    return "Each line must have either a debit or a credit, not both.";
  }
  if (!journalTotals(lines).balanced) return "Debits must equal credits.";
  return null;
}

export function nextDocumentNumber(prefix: string, numbers: string[], start = 1000) {
  const max = numbers.reduce((current, value) => {
    const match = value.match(/(\d+)$/);
    return Math.max(current, match ? Number(match[1]) : 0);
  }, start);
  return `${prefix}-${max + 1}`;
}

export function signedBalance(type: AccountType, debit: number, credit: number) {
  const raw = isDebitNormal(type) ? debit - credit : credit - debit;
  return Number(raw.toFixed(2));
}

export function accountActivity(accountId: string, journals: JournalEntry[]) {
  return journals
    .flatMap((entry) =>
      entry.lines
        .filter((line) => line.accountId === accountId)
        .map((line) => ({ entry, line }))
    )
    .sort((a, b) => {
      const byDate = a.entry.date.localeCompare(b.entry.date);
      if (byDate !== 0) return byDate;
      return a.entry.number.localeCompare(b.entry.number);
    });
}

export function accountBalance(account: Account, journals: JournalEntry[]) {
  const activity = accountActivity(account.id, journals);
  const debit = activity.reduce((sum, row) => sum + row.line.debit, 0);
  const credit = activity.reduce((sum, row) => sum + row.line.credit, 0);
  return {
    debit: Number(debit.toFixed(2)),
    credit: Number(credit.toFixed(2)),
    balance: signedBalance(account.type, debit, credit),
  };
}

export function trialBalance(accounts: Account[], journals: JournalEntry[]) {
  return accounts
    .filter((account) => account.isActive)
    .map((account) => ({ account, ...accountBalance(account, journals) }))
    .filter((row) => row.debit !== 0 || row.credit !== 0 || row.balance !== 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code));
}

export function ledgerRows(account: Account, journals: JournalEntry[]) {
  let running = 0;
  return accountActivity(account.id, journals).map(({ entry, line }) => {
    if (isDebitNormal(account.type)) {
      running = Number((running + line.debit - line.credit).toFixed(2));
    } else {
      running = Number((running + line.credit - line.debit).toFixed(2));
    }
    return { entry, line, running };
  });
}

export function cashbookRows(account: Account, journals: JournalEntry[]) {
  let running = 0;
  return accountActivity(account.id, journals).map(({ entry, line }) => {
    running = Number((running + line.debit - line.credit).toFixed(2));
    return {
      entry,
      line,
      receipt: line.debit,
      payment: line.credit,
      running,
    };
  });
}
