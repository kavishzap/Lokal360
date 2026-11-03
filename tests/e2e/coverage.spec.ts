import { expect, type Page, test } from "@playwright/test";

const EMAIL = "admin@restaurant.com";
const PASSWORD = "Admin123!";

const GUEST_PATHS = [
  "/dashboard",
  "/dashboard/zones",
  "/dashboard/tables",
  "/dashboard/categories",
  "/dashboard/units",
  "/dashboard/ingredients",
  "/dashboard/menu-items",
  "/dashboard/customers",
  "/dashboard/orders",
  "/dashboard/inventory",
  "/dashboard/balance-inventory",
  "/dashboard/purchases",
  "/dashboard/expenses",
  "/dashboard/assets",
  "/dashboard/chart-of-accounts",
  "/dashboard/journal",
  "/dashboard/ledger",
  "/dashboard/cashbook",
  "/dashboard/reports/sales",
  "/dashboard/reports/expenses",
  "/dashboard/reports/pnl",
  "/dashboard/payroll/employees",
  "/dashboard/payroll/employees/new",
  "/dashboard/payroll/leave",
  "/dashboard/payroll/attendance",
  "/dashboard/payroll/payslips",
  "/dashboard/payroll/run",
  "/dashboard/payroll/policies",
  "/dashboard/settings",
  "/dashboard/ai-analytics",
  "/dashboard/me",
];

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

function field(page: Page, label: string) {
  return page
    .locator("label")
    .filter({ hasText: new RegExp(`^${label}$`) })
    .locator("xpath=..")
    .locator("input, textarea")
    .first();
}

for (const path of GUEST_PATHS) {
  test(`sends a signed-out visitor away from ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
}

test("rejects an email address that is not an email", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("not-an-email");
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.locator('input[type="email"]')).toHaveJSProperty("validity.valid", false);
  await expect(page).toHaveURL(/\/login/);
});

test("rejects an unknown owner and a wrong staff password", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("nobody@restaurant.com");
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();

  await page.locator('input[type="email"]').fill("meera.ramdoyal@b42.mu");
  await page.locator('input[type="password"]').fill("wrong-password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("shows the demo password on the sign-in page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Admin123!")).toBeVisible();
  await expect(page.getByText("Staff123!")).toBeVisible();
});

test("remembers the language after a reload", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "KR", exact: true }).click();
  await expect(page.getByText("Konman to'nn fer")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Konman to'nn fer")).toBeVisible();
});

test("remembers a collapsed sidebar after a reload", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
});

test("opens settings and signs out from the header account menu", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: /Alex Martin/ }).click();
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);

  await page.getByRole("button", { name: /Alex Martin/ }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("shows the company initials until a logo is added", async ({ page }) => {
  await login(page);
  await expect(page.getByText("BB", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("B42 Bistro").first()).toBeVisible();
});

test("searches zones, tables, categories and ingredients", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");

  await page.getByRole("link", { name: "Zones", exact: true }).click();
  await page.getByPlaceholder("Search zones...").fill("Indoor");
  await expect(page.getByRole("row", { name: /Indoor Dining/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Outdoor Terrace/ })).toHaveCount(0);

  await page.getByRole("link", { name: "Tables", exact: true }).click();
  await page.getByPlaceholder("Search tables...").fill("Table 01");
  await expect(page.getByRole("row", { name: /Table 01/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Table 02/ })).toHaveCount(0);

  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await page.getByPlaceholder("Search categories...").fill("Burgers");
  await expect(page.getByRole("row", { name: /Burgers/ })).toBeVisible();

  await page.getByRole("link", { name: "Ingredients", exact: true }).click();
  await page.getByPlaceholder("Search ingredients...").fill("Beef Patty");
  await expect(page.getByRole("row", { name: /Beef Patty/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Chicken Breast/ })).toHaveCount(0);
});

test("shows an empty state when a unit search misses", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Units", exact: true }).click();
  await page.getByPlaceholder("Search units...").fill("zzzz-no-unit");
  await expect(page.getByText("No units found")).toBeVisible();
});

test("shows an empty state when a menu search misses", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Menu Items", exact: true }).click();
  await page.getByPlaceholder("Search menu items...").fill("zzzz-no-dish");
  await expect(page.getByText("No menu items found")).toBeVisible();
});

test("filters orders down to served tickets", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await page.getByText("All statuses", { exact: true }).click();
  await page.getByRole("option", { name: "Served", exact: true }).click();
  await expect(page.getByRole("row", { name: /ORD-1003/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /ORD-1001/ })).toHaveCount(0);
});

test("rejects a table with no seats", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Tables", exact: true }).click();
  await page.getByRole("button", { name: "Add table" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Table 11").fill("QA Zero");
  await dialog.getByText("Select a zone").click();
  await page.getByRole("option", { name: "Indoor Dining" }).click();
  await dialog.locator('input[type="number"]').fill("0");
  await dialog.getByRole("button", { name: "Create table" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input[type="number"]')).toHaveJSProperty("validity.valid", false);
  await expect(page.getByRole("row", { name: /QA Zero/ })).toHaveCount(0);
});

test("allows the same table name in a different zone", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Tables", exact: true }).click();
  await page.getByRole("button", { name: "Add table" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Table 11").fill("Table 01");
  await dialog.getByText("Select a zone").click();
  await page.getByRole("option", { name: "Outdoor Terrace" }).click();
  await dialog.getByRole("button", { name: "Create table" }).click();
  await expect(page.getByRole("row", { name: /Table 01/ })).toHaveCount(2);
});

test("leaves a zone in place when delete is cancelled", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Zones", exact: true }).click();
  await page.getByRole("row", { name: /Indoor Dining/ }).getByRole("button").nth(2).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("row", { name: /Indoor Dining/ })).toBeVisible();
});

test("refuses to delete a table that still has orders", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Tables", exact: true }).click();
  await page.getByRole("row", { name: /Table 01/ }).getByRole("button").nth(1).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(/cannot be deleted because/)).toBeVisible();
  await expect(page.getByRole("row", { name: /Table 01/ })).toBeVisible();
});

test("refuses to delete an ingredient used in a recipe", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Ingredients", exact: true }).click();
  await page.getByRole("row", { name: /Beef Patty/ }).getByRole("button").nth(1).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("This ingredient cannot be deleted because it is used in one or more menu item recipes.")).toBeVisible();
});

test("creates one customer from an order phone number", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await page.getByRole("button", { name: "Add order" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Select zone").click();
  await page.getByRole("option", { name: "Indoor Dining" }).click();
  await dialog.getByText("Select table").click();
  await page.getByRole("option", { name: /Table 02/ }).click();
  await dialog.getByPlaceholder("Asha Boolaky").fill("QA Guest");
  await dialog.getByPlaceholder("5712 3456").fill("5711 9901");
  await dialog.getByText("Menu item", { exact: true }).click();
  await page.getByRole("option", { name: /Chicken Burger/ }).click();
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await dialog.getByRole("button", { name: "Create order" }).click();
  await expect(page.getByRole("row", { name: /QA Guest/ })).toBeVisible();

  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Customers" }).first()).toBeVisible();
  await expect(page.getByRole("row", { name: /QA Guest/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /57119901/ })).toHaveCount(1);

  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await page.getByRole("button", { name: "Add order" }).click();
  await dialog.getByText("Select zone").click();
  await page.getByRole("option", { name: "Indoor Dining" }).click();
  await dialog.getByText("Select table").click();
  await page.getByRole("option", { name: /Table 03/ }).click();
  await dialog.getByPlaceholder("Asha Boolaky").fill("QA Guest Again");
  await dialog.getByPlaceholder("5712 3456").fill("57119901");
  await dialog.getByText("Menu item", { exact: true }).click();
  await page.getByRole("option", { name: /Chicken Burger/ }).click();
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await dialog.getByRole("button", { name: "Create order" }).click();

  await page.getByRole("link", { name: "Customers", exact: true }).click();
  await expect(page.getByRole("row", { name: /57119901/ })).toHaveCount(1);
  await expect(page.getByRole("row", { name: /QA Guest Again/ })).toBeVisible();
});

test("rejects an order that has no dishes", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await page.getByRole("button", { name: "Add order" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Select zone").click();
  await page.getByRole("option", { name: "Indoor Dining" }).click();
  await dialog.getByText("Select table").click();
  await page.getByRole("option", { name: /Table 02/ }).click();
  await dialog.getByRole("button", { name: "Create order" }).click();
  await expect(dialog.getByText("Add at least one menu item")).toBeVisible();
});

test("rejects a negative selling price", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Menu Items", exact: true }).click();
  await page.getByRole("button", { name: "Add menu item" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Chicken Burger").fill("QA Free Meal");
  await dialog.getByText("Select category").click();
  await page.getByRole("option", { name: "Burgers", exact: true }).click();
  await dialog.locator('input[type="number"]').first().fill("-5");
  await dialog.getByRole("button", { name: "Create menu item" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input[type="number"]').first()).toHaveJSProperty("validity.valid", false);
});

test("shows stock totals on the inventory page", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Inventory", exact: true }).click();
  await expect(page.getByText("Low stock items")).toBeVisible();
  await expect(page.getByText("Out of stock")).toBeVisible();
  await expect(page.getByText("Total inventory value")).toBeVisible();
});

test("can search the balance check", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Balance Inventory", exact: true }).click();
  await page.getByRole("button", { name: "Run balance check" }).first().click();
  await page.getByPlaceholder("Search ingredients...").fill("Beef Patty");
  await expect(page.getByRole("row", { name: /Beef Patty/ })).toBeVisible();
});

test("rejects an expense with no payee and an asset with no cost", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Expenses", exact: true }).click();
  await page.getByRole("button", { name: "Record expense" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Save expense" }).click();
  await expect(dialog.getByText("Payee is required")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Assets", exact: true }).click();
  await page.getByRole("button", { name: "Register asset" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Toyota Hiace delivery van").fill("QA Shed");
  await dialog.getByRole("button", { name: "Save asset" }).click();
  await expect(dialog.getByText("Cost must be greater than zero")).toBeVisible();
});

test("searches purchases, expenses, assets and the journal", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");

  await page.getByRole("link", { name: "Purchases", exact: true }).click();
  await page.getByPlaceholder("Search purchases...").fill("Island Foods");
  await expect(page.getByText("Island Foods").first()).toBeVisible();

  await page.getByRole("link", { name: "Expenses", exact: true }).click();
  await page.getByPlaceholder("Search expenses...").fill("CEB");
  await expect(page.getByText("CEB").first()).toBeVisible();

  await page.getByRole("link", { name: "Assets", exact: true }).click();
  await page.getByPlaceholder("Search assets...").fill("Hiace");
  await expect(page.getByText("Toyota Hiace").first()).toBeVisible();

  await page.getByRole("link", { name: "Journal Book", exact: true }).click();
  await page.getByPlaceholder("Search journal...").fill("Opening balances");
  await expect(page.getByText("Opening balances")).toBeVisible();
  await expect(page.getByText("Expense EXP-1001")).toHaveCount(0);
});

test("rejects a short account code and a code that already exists", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Chart of Accounts", exact: true }).click();
  await page.getByRole("button", { name: "Add account" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("5200").fill("12");
  await dialog.getByPlaceholder("Packaging").fill("QA Short");
  await dialog.getByRole("button", { name: "Create account" }).click();
  await expect(dialog.getByText("Use a 4 to 6 digit code")).toBeVisible();

  await dialog.getByPlaceholder("5200").fill("1000");
  await dialog.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("An account with this code already exists.")).toBeVisible();
});

test("locks the code on a system account", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Chart of Accounts", exact: true }).click();
  await page.getByRole("row", { name: /Cash on hand/ }).getByRole("button").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Edit account" })).toBeVisible();
  await expect(dialog.locator("input").first()).toBeDisabled();
  await expect(dialog.locator("input").first()).toHaveValue("1000");
});

test("filters the chart to assets and pages past the first ten", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Chart of Accounts", exact: true }).click();
  await expect(page.getByText(/Page 1 of/)).toBeVisible();
  await page.getByText(/Page 1 of/).locator("xpath=..").getByRole("button").nth(1).click();
  await expect(page.getByText(/Page 2 of/)).toBeVisible();

  await page.getByText("All types", { exact: true }).click();
  await page.getByRole("option", { name: "Asset", exact: true }).click();
  await expect(page.getByRole("row", { name: /Cash on hand/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Operating expenses/ })).toHaveCount(0);
});

test("opens a journal and refuses a delete button on a system posting", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Journal Book", exact: true }).click();
  const opening = page.locator(".rounded-xl").filter({ hasText: "Opening balances" }).first();
  await opening.getByRole("button", { name: "View" }).click();
  await expect(page.getByRole("dialog").getByText("Cash on hand")).toBeVisible();
  await page.keyboard.press("Escape");

  const expense = page.locator(".rounded-xl").filter({ hasText: "Expense EXP-1001" }).first();
  await expect(expense.getByRole("button", { name: "View" })).toBeVisible();
  await expect(expense.getByRole("button")).toHaveCount(1);
});

test("deletes a manual journal entry", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Journal Book", exact: true }).click();
  const opening = page.locator(".rounded-xl").filter({ hasText: "Opening balances" }).first();
  await opening.getByRole("button").nth(1).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Opening balances")).toHaveCount(0);
});

test("switches the ledger and the cashbook to the bank", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "1010 Bank" }).click();
  await expect(page.getByRole("combobox")).toContainText("1010 Bank");
  await expect(page.getByText("Credits")).toBeVisible();

  await page.getByRole("link", { name: "Cashbook", exact: true }).click();
  await expect(page.getByRole("heading", { name: "1000 Cash on hand" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1010 Bank" })).toBeVisible();
  await expect(page.getByText("Closing", { exact: true })).toBeVisible();
});

test("switches the sales report to last year and to the accountant view", async ({ page }) => {
  await login(page);
  await openSection(page, "Reports");
  await page.getByRole("link", { name: "Sales report", exact: true }).click();
  await page.getByRole("combobox", { name: "Period" }).click();
  await page.getByRole("option", { name: "Last year" }).click();
  await expect(page.getByText("No sales in this period")).toBeVisible();

  await page.getByRole("combobox", { name: "Period" }).click();
  await page.getByRole("option", { name: "This year" }).click();
  await page.getByRole("combobox", { name: "Prepared for" }).click();
  await page.getByRole("option", { name: /Accountant/ }).click();
  await expect(page.getByRole("cell", { name: "ORD-1001" })).toBeVisible();
  await expect(page.getByText("By menu category")).toBeVisible();
});

test("puts the company BRN on the sales report", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByPlaceholder("C18123456").fill("C99999999");
  await page.getByRole("button", { name: "Save company" }).click();
  await expect(page.getByText("Company details saved")).toBeVisible();

  await openSection(page, "Reports");
  await page.getByRole("link", { name: "Sales report", exact: true }).click();
  await expect(page.getByText("BRN C99999999")).toBeVisible();
});

test("shows the month breakdown on the dashboard", async ({ page }) => {
  await login(page);
  await expect(page.getByText("This month")).toBeVisible();
  await expect(page.getByText("Month by month")).toBeVisible();
  await expect(page.getByText("Where the money went")).toBeVisible();
});

test("searches the payroll list for one person", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Employees", exact: true }).click();
  await page.getByPlaceholder("Search employees...").fill("Kevin");
  await expect(page.getByRole("row", { name: /Kevin/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Meera/ })).toHaveCount(0);
});

test("requires a job title and rejects a negative salary", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Add employee" }).click();
  await field(page, "First name").fill("QA");
  await field(page, "Last name").fill("Waiter");
  await page.getByRole("button", { name: "Add employee" }).click();
  await expect(page.getByText("Job title is required")).toBeVisible();

  await field(page, "Job title").fill("Waiter");
  await field(page, "Basic salary \\(MUR / month\\)").fill("-10");
  await page.getByRole("button", { name: "Add employee" }).click();
  await expect(page.getByText("Salary cannot be negative")).toBeVisible();
});

test("rejects a leave request", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Leave", exact: true }).click();
  await page.getByRole("button", { name: "Request leave" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("textarea").fill("QA reject me");
  await dialog.getByRole("button", { name: "Save request" }).click();
  const row = page.getByRole("row", { name: /QA reject me/ });
  await row.getByRole("button").nth(1).click();
  await expect(row.getByText("rejected")).toBeVisible();

  await page.getByPlaceholder("Search leave...").fill("QA reject me");
  await expect(page.getByRole("row", { name: /QA reject me/ })).toBeVisible();
});

test("marks the remaining working days present", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Attendance", exact: true }).click();
  await page.locator('input[type="month"]').fill("2026-11");
  await page.getByText("All employees", { exact: true }).click();
  await page.getByRole("option", { name: /Meera/ }).click();
  await page.getByRole("button", { name: "Mark remaining working days" }).click();
  await expect(page.getByText(/Marked \d+ working days present/)).toBeVisible();
  await expect(page.getByText("Present marks")).toBeVisible();
});

test("opens a September payslip", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Payslips", exact: true }).click();
  await page.locator('input[type="month"]').fill("2026-09");
  await page.getByRole("row", { name: /2026-09/ }).getByRole("button", { name: "View" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Gross")).toBeVisible();
  await expect(dialog.getByText("PAYE")).toBeVisible();
  await expect(dialog.getByText("Net")).toBeVisible();
});

test("shows the pay-and-file steps before any money moves", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Pay and file", exact: true }).click();
  await page.locator('input[type="month"]').fill("2026-01");
  await expect(page.getByText("Calculated")).toBeVisible();
  await expect(page.getByText("In the books")).toBeVisible();
  await expect(page.getByText("Salaries paid")).toBeVisible();
  await expect(page.getByText("Return filed")).toBeVisible();
  await expect(page.getByText("Remitted")).toBeVisible();
  await expect(page.getByText("12345678")).toBeVisible();
  await expect(page.getByRole("button", { name: "Post to the books" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Calculate this month" })).toBeVisible();
});

test("guards holidays and can restore the legal rates", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Policies", exact: true }).click();
  await expect(page.getByText("NSF employee (%)")).toBeVisible();
  await expect(page.getByText("HRDC levy (%)")).toBeVisible();
  await expect(page.getByText("PRGF (%)")).toBeVisible();
  await expect(page.getByText("New Year").first()).toBeVisible();

  await page.getByRole("button", { name: "Add holiday" }).click();
  await expect(page.getByText("Date and holiday name are required.")).toBeVisible();

  await page.locator('input[type="date"]').fill("2026-01-01");
  await page.getByPlaceholder("Holiday name").fill("Extra New Year");
  await page.getByRole("button", { name: "Add holiday" }).click();
  await expect(page.getByText("That date is already a public holiday.")).toBeVisible();

  await page.locator('input[type="date"]').fill("2026-12-24");
  await page.getByPlaceholder("Holiday name").fill("QA Eve");
  await page.getByRole("button", { name: "Add holiday" }).click();
  await expect(page.getByText("QA Eve")).toBeVisible();
  await page.getByRole("listitem").filter({ hasText: "QA Eve" }).getByRole("button").click();
  await expect(page.getByText("Holiday removed")).toBeVisible();
  await expect(page.getByText("QA Eve")).toHaveCount(0);

  await page.getByRole("button", { name: "Restore legal defaults" }).click();
  await expect(page.getByText("Restored Mauritian default rates. Save to keep them.")).toBeVisible();
});

test("creates a category from the menu page and from the dish form", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Menu Items", exact: true }).click();

  await page.getByRole("button", { name: "Add category" }).click();
  const categoryDialog = page.getByRole("dialog");
  await categoryDialog.getByPlaceholder("Burgers").fill("QA Page Category");
  await categoryDialog.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText("Category created")).toBeVisible();

  await page.getByRole("button", { name: "Add menu item" }).click();
  const dishDialog = page.getByRole("dialog", { name: "Add menu item" });
  await dishDialog.getByRole("button", { name: "Add category" }).click();
  const nested = page.getByRole("dialog", { name: "Add category" });
  await nested.getByPlaceholder("Burgers").fill("QA Dish Category");
  await nested.getByRole("button", { name: "Create category" }).click();
  await expect(dishDialog.getByRole("combobox").first()).toContainText("QA Dish Category");
});

test("shows a 404 and a maintenance page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to the office" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Go to sign in" })).toHaveCount(0);

  await page.goto("/maintenance");
  await expect(page.getByRole("heading", { name: "Under maintenance" })).toBeVisible();
  await expect(page.getByText("The office is briefly closed while we update it. Please come back shortly.")).toBeVisible();
});

test("sends a staff member away from AI Analytics", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("meera.ramdoyal@b42.mu");
  await page.locator('input[type="password"]').fill("Staff123!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard\/me$/);
  await page.goto("/dashboard/ai-analytics");
  await expect(page).toHaveURL(/\/dashboard\/me$/);
  await expect(page.getByRole("heading", { name: "Hello, Meera" })).toBeVisible();
  await expect(page.getByText("Rs").first()).toBeVisible();
});
