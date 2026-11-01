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

async function openRestaurant(page: Page) {
  const section = page.getByRole("button", { name: "Restaurant Management" });
  if ((await section.getAttribute("aria-expanded")) !== "true") {
    await section.click();
  }
}

test("sends an anonymous visitor to the login page and blocks the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/dashboard/zones");
  await expect(page).toHaveURL(/\/login/);
});

test("rejects an empty password and a wrong password, then signs in", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Password is required")).toBeVisible();

  await page.locator('input[type="password"]').fill("not-the-password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Alex Martin").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Restaurant Management" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
});

test("navigates the restaurant modules from the sidebar", async ({ page }) => {
  await login(page);
  await openRestaurant(page);
  const links: Array<[string, string]> = [
    ["Zones", "/dashboard/zones"],
    ["Tables", "/dashboard/tables"],
    ["Categories", "/dashboard/categories"],
    ["Ingredients", "/dashboard/ingredients"],
    ["Menu Items", "/dashboard/menu-items"],
    ["Inventory", "/dashboard/inventory"],
  ];

  for (const [label, href] of links) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { name: label }).first()).toBeVisible();
  }
});

test("creates, edits, rejects duplicates, and deletes a zone", async ({ page }) => {
  await login(page);
  await openRestaurant(page);
  await page.getByRole("link", { name: "Zones", exact: true }).click();

  await page.getByRole("button", { name: "Add zone" }).click();
  await page.getByRole("button", { name: "Create zone" }).click();
  await expect(page.getByText("Zone name is required")).toBeVisible();

  await page.getByPlaceholder("Indoor Dining").fill("   ");
  await page.getByRole("button", { name: "Create zone" }).click();
  await expect(page.getByText("Zone name is required.")).toBeVisible();

  await page.getByPlaceholder("Indoor Dining").fill("QA Patio");
  await page.getByRole("button", { name: "Create zone" }).click();
  await expect(page.getByRole("row", { name: /QA Patio/ })).toBeVisible();

  await page.getByRole("button", { name: "Add zone" }).click();
  await page.getByPlaceholder("Indoor Dining").fill("qa patio");
  await page.getByRole("button", { name: "Create zone" }).click();
  await expect(page.getByText("A zone with this name already exists.")).toBeVisible();
  await page.keyboard.press("Escape");

  const row = page.getByRole("row", { name: /QA Patio/ });
  await row.getByRole("button").nth(1).click();
  await page.getByPlaceholder("Indoor Dining").fill("QA Garden");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("row", { name: /QA Garden/ })).toBeVisible();

  await page.getByRole("row", { name: /QA Garden/ }).getByRole("button").nth(2).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("row", { name: /QA Garden/ })).toHaveCount(0);
});

test("assigns a table to a zone and blocks a duplicate name in that zone", async ({ page }) => {
  await login(page);
  await openRestaurant(page);
  await page.getByRole("link", { name: "Zones", exact: true }).click();
  await page.getByRole("button", { name: "Add zone" }).click();
  await page.getByPlaceholder("Indoor Dining").fill("QA Floor");
  await page.getByRole("button", { name: "Create zone" }).click();
  await expect(page.getByRole("row", { name: /QA Floor/ })).toBeVisible();

  await page.getByRole("link", { name: "Tables", exact: true }).click();
  await page.getByRole("button", { name: "Add table" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Table 11").fill("QA 1");
  await dialog.getByText("Select a zone").click();
  await page.getByRole("option", { name: "QA Floor" }).click();
  await dialog.getByRole("button", { name: "Create table" }).click();
  await expect(page.getByRole("row", { name: /QA 1/ })).toBeVisible();

  await page.getByRole("button", { name: "Add table" }).click();
  await dialog.getByPlaceholder("Table 11").fill("qa 1");
  await dialog.getByText("Select a zone").click();
  await page.getByRole("option", { name: "QA Floor" }).click();
  await dialog.getByRole("button", { name: "Create table" }).click();
  await expect(page.getByText("A table with this name already exists in the selected zone.")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Zones", exact: true }).click();
  await page.getByRole("row", { name: /QA Floor/ }).getByRole("button").nth(2).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByText("This zone cannot be deleted because 1 table is assigned to it. Reassign or delete those tables first.")
  ).toBeVisible();
});

test("creates a category and rejects a duplicate name", async ({ page }) => {
  await login(page);
  await openRestaurant(page);
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await page.getByRole("button", { name: "Add category" }).click();
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText("Category name is required")).toBeVisible();

  await page.getByPlaceholder("Burgers").fill("QA Late Plates");
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByRole("row", { name: /QA Late Plates/ })).toBeVisible();

  await page.getByRole("button", { name: "Add category" }).click();
  await page.getByPlaceholder("Burgers").fill("qa late plates");
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText(/already exists/i)).toBeVisible();
});

test("creates an ingredient and rejects a duplicate name", async ({ page }) => {
  await login(page);
  await openRestaurant(page);
  await page.getByRole("link", { name: "Ingredients", exact: true }).click();
  await page.getByRole("button", { name: "Add ingredient" }).click();
  await page.getByRole("button", { name: "Create ingredient" }).click();
  await expect(page.getByText("Ingredient name is required")).toBeVisible();

  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Chicken Breast").fill("QA Saffron");
  await dialog.getByText("Select a unit").click();
  await page.getByRole("option", { name: "Kilogram (kg)" }).click();
  await dialog.getByRole("button", { name: "Create ingredient" }).click();
  await expect(page.getByRole("row", { name: /QA Saffron/ })).toBeVisible();

  await page.getByRole("button", { name: "Add ingredient" }).click();
  await dialog.getByPlaceholder("Chicken Breast").fill("qa saffron");
  await dialog.getByText("Select a unit").click();
  await page.getByRole("option", { name: "Kilogram (kg)" }).click();
  await dialog.getByRole("button", { name: "Create ingredient" }).click();
  await expect(page.getByText("An ingredient with this name already exists.")).toBeVisible();
});

test("creates a menu item in a category with an ingredient", async ({ page }) => {
  await login(page);
  await openRestaurant(page);
  await page.getByRole("link", { name: "Menu Items", exact: true }).click();
  await page.getByRole("button", { name: "Add menu item" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Create menu item" }).click();
  await expect(dialog.getByText("Menu item name is required")).toBeVisible();

  await dialog.getByPlaceholder("Chicken Burger").fill("QA Night Special");
  await dialog.getByText("Select category").click();
  await page.getByRole("option", { name: "Burgers", exact: true }).click();
  await dialog.locator('input[type="number"]').first().fill("199");
  await dialog.getByPlaceholder("Search ingredients to add...").fill("Beef Patty");
  await dialog.getByRole("button", { name: /Beef Patty/ }).click();
  await dialog.getByRole("button", { name: "Create menu item" }).click();
  await expect(page.getByText("QA Night Special").first()).toBeVisible();
});

test("tracks an ingredient and refuses to remove more stock than is on hand", async ({ page }) => {
  await login(page);
  await openRestaurant(page);
  await page.getByRole("link", { name: "Ingredients", exact: true }).click();
  await page.getByRole("button", { name: "Add ingredient" }).click();
  const ingredientDialog = page.getByRole("dialog");
  await ingredientDialog.getByPlaceholder("Chicken Breast").fill("QA Saffron Stock");
  await ingredientDialog.getByText("Select a unit").click();
  await page.getByRole("option", { name: "Kilogram (kg)" }).click();
  await ingredientDialog.getByRole("button", { name: "Create ingredient" }).click();

  await page.getByRole("link", { name: "Inventory", exact: true }).click();
  await page.getByRole("button", { name: "Track ingredient" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Select ingredient").click();
  await page.getByRole("option", { name: /QA Saffron Stock/ }).click();
  const numbers = dialog.locator('input[type="number"]');
  await numbers.nth(0).fill("5");
  await numbers.nth(1).fill("2");
  await numbers.nth(2).fill("90");
  await dialog.getByRole("button", { name: "Create record" }).click();
  await expect(page.getByRole("row", { name: /QA Saffron Stock/ })).toBeVisible();

  const row = page.getByRole("row", { name: /QA Saffron Stock/ });
  await row.getByRole("button").nth(1).click();
  const stockDialog = page.getByRole("dialog");
  await stockDialog.locator('input[type="number"]').fill("100");
  await stockDialog.locator("textarea").fill("Too much");
  await stockDialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Stock cannot go below zero.")).toBeVisible();
});
