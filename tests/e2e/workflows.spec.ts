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

function field(page: Page, label: string) {
  return page
    .locator("label")
    .filter({ hasText: new RegExp(`^${label}$`) })
    .locator("xpath=..")
    .locator("input, textarea")
    .first();
}

test("describes the product on the sign-in page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("The floor, the books and the wage bill in one place.")).toBeVisible();
  await expect(page.getByText("Zones, tables, orders, recipes and the storeroom.").first()).toBeVisible();
  await expect(page.getByText("Purchases, expenses, assets, the journal and the cashbook.").first()).toBeVisible();
  await expect(page.getByText("Staff, leave, attendance and payslips with CSG, NSF, PRGF and PAYE.").first()).toBeVisible();
  await expect(page.getByText("admin@restaurant.com")).toBeVisible();
});

test("rejects a blank company name and a bad email", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByPlaceholder("B42 Bistro", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save company" }).click();
  await expect(page.getByText("Company name is required")).toBeVisible();

  await page.getByPlaceholder("B42 Bistro", { exact: true }).fill("B42 Bistro");
  await page.getByPlaceholder("hello@b42bistro.mu").fill("not-an-email");
  await page.getByRole("button", { name: "Save company" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
});

test("creates a unit and rejects a duplicate name and abbreviation", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Units", exact: true }).click();
  await page.getByRole("button", { name: "Add unit" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Create unit" }).click();
  await expect(dialog.getByText("Unit name is required")).toBeVisible();

  await dialog.getByPlaceholder("Kilogram").fill("QA Pinch");
  await dialog.getByPlaceholder("kg").fill("qap");
  await dialog.getByRole("button", { name: "Create unit" }).click();
  await expect(page.getByRole("row", { name: /QA Pinch/ })).toBeVisible();

  await page.getByRole("button", { name: "Add unit" }).click();
  await dialog.getByPlaceholder("Kilogram").fill("qa pinch");
  await dialog.getByPlaceholder("kg").fill("qap2");
  await dialog.getByRole("button", { name: "Create unit" }).click();
  await expect(page.getByText("A unit with this name already exists.")).toBeVisible();

  await dialog.getByPlaceholder("Kilogram").fill("QA Other");
  await dialog.getByPlaceholder("kg").fill("kg");
  await dialog.getByRole("button", { name: "Create unit" }).click();
  await expect(page.getByText("A unit with this abbreviation already exists.")).toBeVisible();
});

test("refuses to delete a unit that ingredients already use", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Units", exact: true }).click();
  await page.getByRole("row", { name: /Kilogram/ }).getByRole("button").nth(1).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("This unit cannot be deleted because it is used by one or more ingredients.")).toBeVisible();
});

test("filters units from the search box", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Units", exact: true }).click();
  await page.getByPlaceholder("Search units...").fill("Kilogram");
  await expect(page.getByRole("row", { name: /Kilogram/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Piece/ })).toHaveCount(0);
});

test("finds a seed order and hides it when the search misses", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page.getByRole("row", { name: /ORD-1001/ })).toBeVisible();
  await page.getByPlaceholder("Search orders...").fill("ORD-1001");
  await expect(page.getByRole("row", { name: /ORD-1001/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /ORD-1002/ })).toHaveCount(0);
  await page.getByPlaceholder("Search orders...").fill("no-such-order");
  await expect(page.getByText("No orders found")).toBeVisible();
});

test("creates an order for a table and a dish", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await page.getByRole("button", { name: "Add order" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Select zone").click();
  await page.getByRole("option", { name: "Indoor Dining" }).click();
  await dialog.getByText("Select table").click();
  await page.getByRole("option", { name: /Table 01/ }).click();
  await dialog.getByText("Menu item", { exact: true }).click();
  await page.getByRole("option", { name: /Chicken Burger/ }).click();
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(dialog.getByText("Chicken Burger").first()).toBeVisible();
  await dialog.getByRole("button", { name: "Create order" }).click();
  await expect(page.getByRole("row", { name: /Table 01/ }).first()).toBeVisible();
});

test("runs a balance check against the orders and the storeroom", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Balance Inventory", exact: true }).click();
  await page.getByRole("button", { name: "Run balance check" }).first().click();
  await expect(page.getByRole("button", { name: "Run check again" }).first()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Used by orders" })).toBeVisible();
});

test("records a supplier purchase", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Purchases", exact: true }).click();
  await page.getByRole("button", { name: "Record purchase" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Save purchase" }).click();
  await expect(dialog.getByText("Supplier is required")).toBeVisible();

  await dialog.getByPlaceholder("Island Foods Ltd").fill("QA Foods");
  await dialog.getByPlaceholder("INV-4421").fill("QA-100");
  await dialog.locator("tbody tr").first().getByRole("textbox").fill("Chicken");
  await dialog.locator("tbody input[type='number']").nth(1).fill("80");
  await dialog.getByRole("button", { name: "Save purchase" }).click();
  await expect(page.getByRole("row", { name: /PUR-.*QA Foods/ }).first()).toBeVisible();
});

test("records an operating expense", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Expenses", exact: true }).click();
  await page.getByRole("button", { name: "Record expense" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("CEB").fill("QA Power");
  await dialog.getByPlaceholder("Electricity").fill("QA electricity");
  await dialog.locator("tbody input[type='number']").fill("1500");
  await dialog.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByRole("row", { name: /QA Power/ })).toBeVisible();
});

test("registers a depreciating asset", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Assets", exact: true }).click();
  await page.getByRole("button", { name: "Register asset" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Toyota Hiace delivery van").fill("QA Van");
  await dialog.locator('input[type="number"]').first().fill("250000");
  await expect(dialog.getByText(/per month/)).toBeVisible();
  await dialog.getByRole("button", { name: "Save asset" }).click();
  await expect(page.getByRole("row", { name: /QA Van/ })).toBeVisible();
});

test("adds a ledger account and protects the system accounts", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Chart of Accounts", exact: true }).click();
  await expect(page.getByRole("row", { name: /Cash on hand/ }).getByRole("button").nth(1)).toBeDisabled();

  await page.getByRole("button", { name: "Add account" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("5200").fill("6100");
  await dialog.getByPlaceholder("Packaging").fill("QA Packaging");
  await dialog.getByRole("button", { name: "Create account" }).click();
  await page.getByPlaceholder("Search accounts...").fill("QA Packaging");
  await expect(page.getByRole("row", { name: /QA Packaging/ })).toBeVisible();

  await page.getByRole("row", { name: /QA Packaging/ }).getByRole("button").nth(1).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("row", { name: /QA Packaging/ })).toHaveCount(0);
});

test("rejects an unbalanced journal and posts a balanced one", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Journal Book", exact: true }).click();
  await page.getByRole("button", { name: "Add journal entry" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Rent for October").fill("QA float");
  await dialog.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: "1000 Cash on hand" }).click();
  await dialog.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "1010 Bank" }).click();
  const amounts = dialog.locator('input[type="number"]');
  await amounts.nth(0).fill("25");
  await dialog.getByRole("button", { name: "Post entry" }).click();
  await expect(page.getByText("Debits must equal credits.")).toBeVisible();

  await amounts.nth(3).fill("25");
  await expect(dialog.getByText("In balance")).toBeVisible();
  await dialog.getByRole("button", { name: "Post entry" }).click();
  await expect(page.getByText("QA float")).toBeVisible();
  await expect(page.getByText("Manual").first()).toBeVisible();
});

test("opens the cash account in the ledger and the cashbook", async ({ page }) => {
  await login(page);
  await openSection(page, "Accounting");
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await expect(page.getByRole("combobox")).toContainText("1000 Cash on hand");
  await expect(page.getByText("Debits")).toBeVisible();

  await page.getByRole("link", { name: "Cashbook", exact: true }).click();
  await expect(page.getByRole("combobox")).toContainText("Cash on hand");
  await expect(page.getByText("Receipts", { exact: true })).toBeVisible();
  await expect(page.getByText("Payments", { exact: true })).toBeVisible();
  await expect(page.getByText("Closing", { exact: true })).toBeVisible();
});

test("shows this year's sales, expenses and profit", async ({ page }) => {
  await login(page);
  await openSection(page, "Reports");
  await page.getByRole("link", { name: "Sales report", exact: true }).click();
  await expect(page.getByText("No sales in this period")).toHaveCount(0);
  await expect(page.getByText("Sales mix")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate PDF" })).toBeVisible();
  await page.getByRole("button", { name: "Generate PDF" }).click();
  await expect(page.getByText("PDF export is not connected yet.")).toBeVisible();

  await page.getByRole("link", { name: "Expense report", exact: true }).click();
  await expect(page.getByText("Total spend")).toBeVisible();
  await expect(page.getByText("Operating expenses").first()).toBeVisible();
  await expect(page.getByText("Rs 4,200.00").first()).toBeVisible();

  await page.getByRole("link", { name: "P&L", exact: true }).click();
  await expect(page.getByText("Gross profit").first()).toBeVisible();
  await expect(page.getByText("What is left").first()).toBeVisible();
  await expect(page.getByText("B42 Bistro").first()).toBeVisible();
});

test("adds an employee from the full page", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Employees", exact: true }).click();
  await page.getByRole("button", { name: "Add employee" }).click();
  await expect(page).toHaveURL(/\/payroll\/employees\/new$/);
  await page.getByRole("button", { name: "Add employee" }).click();
  await expect(page.getByText("First name is required")).toBeVisible();

  await field(page, "First name").fill("QA");
  await field(page, "Last name").fill("Cook");
  await field(page, "Job title").fill("Commis");
  await field(page, "Basic salary \\(MUR / month\\)").fill("28000");
  await page.getByRole("button", { name: "Add employee" }).click();
  await expect(page).toHaveURL(/\/payroll\/employees$/);
  await expect(page.getByRole("row", { name: /QA Cook/ })).toBeVisible();

  await page.getByRole("button", { name: "Edit QA Cook" }).click();
  await expect(page.getByRole("heading", { name: "QA Cook" })).toBeVisible();
});

test("records leave and approves it", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Leave", exact: true }).click();
  await page.getByRole("button", { name: "Request leave" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("combobox").first()).not.toContainText(/[0-9a-f]{8}-/);
  await dialog.locator("textarea").fill("QA family day");
  await dialog.getByRole("button", { name: "Save request" }).click();
  const row = page.getByRole("row", { name: /QA family day/ });
  await expect(row).toBeVisible();
  await row.getByRole("button").first().click();
  await expect(row.getByText("approved")).toBeVisible();
});

test("records a day's attendance", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Attendance", exact: true }).click();
  await page.getByRole("button", { name: "Add attendance" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("combobox").first()).toContainText("Meera");
  await dialog.locator("textarea").fill("QA shift");
  await dialog.getByRole("button", { name: "Save attendance" }).click();
  await expect(page.getByText("Attendance saved")).toBeVisible();
  await expect(page.getByRole("row", { name: /Meera/ }).first()).toBeVisible();
});

test("generates payslips for the team", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Payslips", exact: true }).click();
  await page.locator('input[type="month"]').fill("2026-11");
  await page.getByRole("button", { name: "Generate all" }).click();
  await expect(page.getByText("Payslips generated")).toBeVisible();
  await expect(page.getByRole("row", { name: /2026-11 Meera/ })).toBeVisible();
  await expect(page.getByText(/Net pay 2026-11/)).toBeVisible();
});

test("calculates the month, posts it, and can undo the posting", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Pay and file", exact: true }).click();
  await page.locator('input[type="month"]').fill("2026-11");
  await page.getByRole("button", { name: "Calculate this month" }).click();
  await expect(page.getByRole("row", { name: /Meera/ })).toBeVisible();
  await expect(page.getByText("Net to pay")).toBeVisible();
  await page.getByRole("button", { name: "Post to the books" }).click();
  await expect(page.getByRole("button", { name: "Undo posting" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the journal" })).toBeVisible();
  await page.getByRole("button", { name: "Undo posting" }).click();
  await expect(page.getByRole("button", { name: "Post to the books" })).toBeVisible();
});

test("saves the payroll policy and adds a public holiday", async ({ page }) => {
  await login(page);
  await openSection(page, "Payroll");
  await page.getByRole("link", { name: "Policies", exact: true }).click();
  await expect(page.getByText("CSG threshold (MUR)")).toBeVisible();
  await page.getByRole("button", { name: "Save policy" }).click();
  await expect(page.getByText("Payroll policy saved")).toBeVisible();

  await page.locator('input[type="date"]').fill("2026-12-26");
  await page.getByPlaceholder("Holiday name").fill("QA Holiday");
  await page.getByRole("button", { name: "Add holiday" }).click();
  await expect(page.getByText("QA Holiday")).toBeVisible();
});

test("lets a staff member see their pay and request leave", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("meera.ramdoyal@b42.mu");
  await page.locator('input[type="password"]').fill("Staff123!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard\/me$/);
  await expect(page.getByRole("heading", { name: "Hello, Meera" })).toBeVisible();
  await expect(page.getByText("Latest payslip")).toBeVisible();

  await page.locator('input[type="date"]').nth(0).fill("2026-11-20");
  await page.locator('input[type="date"]').nth(1).fill("2026-11-20");
  await page.getByPlaceholder("Reason").fill("QA day off");
  await page.getByRole("button", { name: "Request leave" }).click();
  await expect(page.getByText("Leave request sent")).toBeVisible();
  await expect(page.getByText("pending").first()).toBeVisible();
});

test("keeps staff off the books and the administrator off the staff page", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("meera.ramdoyal@b42.mu");
  await page.locator('input[type="password"]').fill("Staff123!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard\/me$/);
  for (const path of ["/dashboard/purchases", "/dashboard/payroll/employees", "/dashboard/settings", "/dashboard/journal"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/dashboard\/me$/);
  }

  await page.getByRole("button", { name: /Meera Ramdoyal/ }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await login(page);
  await page.goto("/dashboard/me");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Hello, Alex" })).toBeVisible();
});

test("switches the books into Mauritian Kreol", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "KR", exact: true }).click();
  await expect(page.getByText("Konman to'nn fer")).toBeVisible();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByText("How much you took")).toBeVisible();
});

test("opens a section from the collapsed sidebar", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await page.getByRole("button", { name: "Restaurant Management", exact: true }).click();
  await page.getByRole("link", { name: "Zones", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/zones$/);
  await expect(page.getByRole("heading", { name: "Zones" }).first()).toBeVisible();
});

test("refuses to delete a category that still has dishes", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await page.getByRole("row", { name: /Burgers/ }).getByRole("button").nth(1).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(/cannot be deleted because/)).toBeVisible();
});

test("finds a tracked ingredient in inventory", async ({ page }) => {
  await login(page);
  await openSection(page, "Restaurant Management");
  await page.getByRole("link", { name: "Inventory", exact: true }).click();
  await page.getByPlaceholder("Search inventory...").fill("Chicken Breast");
  await expect(page.getByRole("row", { name: /Chicken Breast/ })).toBeVisible();
  await expect(page.getByText("Ingredients tracked")).toBeVisible();
});

test("shows rupee figures on the owner dashboard", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Hello, Alex" })).toBeVisible();
  await expect(page.getByText("How much you took")).toBeVisible();
  await expect(page.getByText(/Rs/).first()).toBeVisible();
  await expect(page.getByText("Cash and bank")).toBeVisible();
  await expect(page.getByText("In the bank")).toBeVisible();
});
