import { expect, type Page, test } from "@playwright/test";

const EMAIL = "admin@restaurant.com";
const PASSWORD = "Admin123!";

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openSection(page: Page, name: string) {
  const section = page.getByRole("button", { name, exact: true });
  if ((await section.getAttribute("aria-expanded")) !== "true") {
    await section.click();
  }
}

async function expectPage(page: Page, link: string, href: string, heading: string) {
  await page.getByRole("link", { name: link, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { name: heading, exact: true }).first()).toBeVisible();
}

test("shows the owner's money on the dashboard", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Hello, Alex" })).toBeVisible();
  await expect(page.getByText("How much you took")).toBeVisible();
  await expect(page.getByText("Where the money went")).toBeVisible();
  await expect(page.getByText("Cash and bank")).toBeVisible();
});

test("opens every back-office page from the sidebar", async ({ page }) => {
  await login(page);

  await openSection(page, "Restaurant Management");
  await expectPage(page, "Units", "/dashboard/units", "Units of measurement");
  await expectPage(page, "Orders", "/dashboard/orders", "Orders");
  await expectPage(page, "Balance Inventory", "/dashboard/balance-inventory", "Balance inventory");

  await openSection(page, "Accounting");
  await expectPage(page, "Purchases", "/dashboard/purchases", "Purchases");
  await expectPage(page, "Expenses", "/dashboard/expenses", "Expenses");
  await expectPage(page, "Assets", "/dashboard/assets", "Assets");
  await expectPage(page, "Chart of Accounts", "/dashboard/chart-of-accounts", "Chart of Accounts");
  await expectPage(page, "Journal Book", "/dashboard/journal", "Journal Book");
  await expectPage(page, "Ledger", "/dashboard/ledger", "Ledger");
  await expectPage(page, "Cashbook", "/dashboard/cashbook", "Cashbook");

  await openSection(page, "Reports");
  await expectPage(page, "Expense report", "/dashboard/reports/expenses", "Expense report");
  await expectPage(page, "Sales report", "/dashboard/reports/sales", "Sales report");
  await expectPage(page, "P&L", "/dashboard/reports/pnl", "Profit and loss");

  await openSection(page, "Payroll");
  await expectPage(page, "Employees", "/dashboard/payroll/employees", "Employees");
  await expectPage(page, "Leave", "/dashboard/payroll/leave", "Leave");
  await expectPage(page, "Attendance", "/dashboard/payroll/attendance", "Attendance");
  await expectPage(page, "Payslips", "/dashboard/payroll/payslips", "Payslips");
  await expectPage(page, "Pay and file", "/dashboard/payroll/run", "Pay and file");
  await expectPage(page, "Policies", "/dashboard/payroll/policies", "Payroll policies");

  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
  await expect(page.getByRole("heading", { name: "Settings" }).first()).toBeVisible();
  await expect(page.getByText("Demo authentication")).toHaveCount(0);
  await expect(page.getByText("Demo data")).toHaveCount(0);
});

test("keeps AI Analytics locked", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  const locked = page.getByRole("button", { name: "AI Analytics", exact: true });
  await expect(locked).toBeVisible();
  await locked.click({ force: true });
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/dashboard/ai-analytics");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Hello, Alex" })).toBeVisible();
});

test("shows names, not ids, in edit dropdowns", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");

  await page.getByRole("link", { name: "Tables", exact: true }).click();
  await page.getByRole("row", { name: /Table 01/ }).getByRole("button").first().click();
  const tableDialog = page.getByRole("dialog");
  await expect(tableDialog.getByRole("combobox")).toContainText("Indoor Dining");
  await expect(tableDialog.getByRole("combobox")).not.toContainText(/[0-9a-f]{8}-/);
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Ingredients", exact: true }).click();
  await page.getByRole("row", { name: /Chicken Breast/ }).getByRole("button").first().click();
  const ingredientDialog = page.getByRole("dialog");
  await expect(ingredientDialog.getByRole("combobox")).toContainText("Kilogram (kg)");
  await expect(ingredientDialog.getByRole("combobox")).not.toContainText(/[0-9a-f]{8}-/);
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Menu Items", exact: true }).click();
  await page.getByPlaceholder("Search menu items...").fill("Chicken Burger");
  const card = page
    .getByRole("img", { name: "Chicken Burger", exact: true })
    .locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]");
  await card.getByRole("button").first().click();
  const menuDialog = page.getByRole("dialog");
  await expect(menuDialog.getByRole("combobox")).toContainText("Burgers");
  await expect(menuDialog.getByRole("combobox")).not.toContainText(/[0-9a-f]{8}-/);
});

test("signs staff in to their own page and keeps them there", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("meera.ramdoyal@b42.mu");
  await page.locator('input[type="password"]').fill("Staff123!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard\/me$/);
  await expect(page.getByRole("heading", { name: /Meera/ })).toBeVisible();

  await page.goto("/dashboard/journal");
  await expect(page).toHaveURL(/\/dashboard\/me$/);
});

test("saves the company name onto the sidebar", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByPlaceholder("B42 Bistro", { exact: true }).fill("QA Bistro");
  await page.getByRole("button", { name: "Save company" }).click();
  await expect(page.getByText("Company details saved")).toBeVisible();
  await expect(page.getByText("QA Bistro").first()).toBeVisible();
});

test("switches the language and signs out", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "FR", exact: true }).click();
  await expect(page.getByText("Combien vous avez fait")).toBeVisible();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByText("How much you took")).toBeVisible();

  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
