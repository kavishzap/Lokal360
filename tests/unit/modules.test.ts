import { beforeEach, describe, expect, it } from "vitest";
import { createSeedData } from "@/data/seed";
import { DEMO_CREDENTIALS, SESSION_KEY, STORAGE_KEY } from "@/lib/constants";
import { getStockStatus, inventoryValue } from "@/lib/inventory";
import { emptyData, loadAppData } from "@/lib/storage";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import type { MenuItem } from "@/types";

type MenuInput = Omit<MenuItem, "id" | "createdAt" | "updatedAt">;

function resetStores() {
  localStorage.clear();
  useAuthStore.setState({ hydrated: true, session: null });
  useAppStore.setState({ ...emptyData(), hydrated: true });
}

function menuInput(categoryId: string, overrides: Partial<MenuInput> = {}): MenuInput {
  return {
    name: "QA Burger",
    nameEn: "QA Burger",
    description: "Test dish",
    categoryId,
    price: 250,
    manufacturedPrice: 80,
    image: null,
    preparationTime: 10,
    isAvailable: true,
    isFeatured: false,
    ingredients: [],
    ...overrides,
  };
}

describe("authentication", () => {
  beforeEach(resetStores);

  it("rejects an empty password and a wrong password", () => {
    const login = useAuthStore.getState().login;
    expect(login(DEMO_CREDENTIALS.email, "", true)).toMatch(/invalid email or password/i);
    expect(login(DEMO_CREDENTIALS.email, "wrong-password", true)).toMatch(/invalid email or password/i);
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("accepts the demo account regardless of email case and surrounding spaces", () => {
    const error = useAuthStore.getState().login("  Admin@Restaurant.com  ", DEMO_CREDENTIALS.password, true);
    expect(error).toBeNull();
    expect(useAuthStore.getState().session).toMatchObject({
      email: DEMO_CREDENTIALS.email,
      name: "Alex Martin",
      role: "Administrator",
      rememberMe: true,
    });
  });

  it("restores a remembered session and clears it on logout", () => {
    useAuthStore.getState().login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password, true);
    useAuthStore.setState({ hydrated: false, session: null });
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().session?.email).toBe(DEMO_CREDENTIALS.email);

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

describe("zones, tables, categories, ingredients, menu items, and inventory", () => {
  beforeEach(resetStores);

  it("creates, edits, and deletes a zone, and trims the name", () => {
    const created = useAppStore.getState().createZone({
      name: "  QA Patio  ",
      description: "Outside",
      isActive: true,
    });
    expect(created.ok).toBe(true);
    const zone = useAppStore.getState().zones[0];
    expect(zone.name).toBe("QA Patio");
    expect(zone.description).toBe("Outside");

    const updated = useAppStore.getState().updateZone(zone.id, {
      name: "QA Garden",
      description: "Shaded",
      isActive: false,
    });
    expect(updated.ok).toBe(true);
    expect(useAppStore.getState().zones[0]).toMatchObject({
      name: "QA Garden",
      description: "Shaded",
      isActive: false,
    });

    expect(useAppStore.getState().deleteZone(zone.id).ok).toBe(true);
    expect(useAppStore.getState().zones).toHaveLength(0);
  });

  it("rejects an empty zone name and a case-insensitive duplicate", () => {
    expect(
      useAppStore.getState().createZone({ name: "   ", description: "", isActive: true }).ok
    ).toBe(false);

    expect(
      useAppStore.getState().createZone({ name: "Terrace", description: "", isActive: true }).ok
    ).toBe(true);
    const duplicate = useAppStore.getState().createZone({
      name: " terrace ",
      description: "",
      isActive: true,
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.error).toMatch(/already exists/i);
    expect(useAppStore.getState().zones).toHaveLength(1);
  });

  it("blocks renaming a zone onto another zone and deleting a zone that still has tables", () => {
    const first = useAppStore.getState().createZone({ name: "Indoor", description: "", isActive: true });
    const second = useAppStore.getState().createZone({ name: "Bar", description: "", isActive: true });
    if (!first.ok || !second.ok || !first.id || !second.id) throw new Error("zone setup failed");

    const rename = useAppStore.getState().updateZone(second.id, {
      name: "indoor",
      description: "",
      isActive: true,
    });
    expect(rename.ok).toBe(false);

    useAppStore.getState().createTable({
      name: "T1",
      zoneId: first.id,
      capacity: 4,
      isActive: true,
    });
    const removed = useAppStore.getState().deleteZone(first.id);
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.error).toMatch(/table/i);
    expect(useAppStore.getState().zones.some((zone) => zone.id === first.id)).toBe(true);
  });

  it("assigns tables to zones and allows the same name in a different zone", () => {
    const indoor = useAppStore.getState().createZone({ name: "Indoor", description: "", isActive: true });
    const outdoor = useAppStore.getState().createZone({ name: "Outdoor", description: "", isActive: true });
    if (!indoor.ok || !outdoor.ok || !indoor.id || !outdoor.id) throw new Error("zone setup failed");

    expect(
      useAppStore.getState().createTable({ name: "   ", zoneId: indoor.id, capacity: 2, isActive: true }).ok
    ).toBe(false);
    expect(
      useAppStore.getState().createTable({ name: "T1", zoneId: "", capacity: 2, isActive: true }).ok
    ).toBe(false);
    expect(
      useAppStore.getState().createTable({ name: "T1", zoneId: indoor.id, capacity: 0, isActive: true }).ok
    ).toBe(false);

    const created = useAppStore.getState().createTable({
      name: "  Window  ",
      zoneId: indoor.id,
      capacity: 2,
      isActive: true,
    });
    expect(created.ok).toBe(true);
    expect(useAppStore.getState().tables[0]).toMatchObject({ name: "Window", zoneId: indoor.id, capacity: 2 });

    const sameZone = useAppStore.getState().createTable({
      name: "window",
      zoneId: indoor.id,
      capacity: 4,
      isActive: true,
    });
    expect(sameZone.ok).toBe(false);

    const otherZone = useAppStore.getState().createTable({
      name: "Window",
      zoneId: outdoor.id,
      capacity: 6,
      isActive: false,
    });
    expect(otherZone.ok).toBe(true);

    const moved = useAppStore.getState().updateTable(useAppStore.getState().tables[0].id, {
      name: "Window",
      zoneId: indoor.id,
      capacity: 8,
      isActive: true,
    });
    expect(moved.ok).toBe(false);

    expect(useAppStore.getState().deleteTable(created.id!).ok).toBe(true);
    expect(useAppStore.getState().tables.some((table) => table.id === created.id)).toBe(false);
  });

  it("blocks table deletion while an order still references the table", () => {
    const zone = useAppStore.getState().createZone({ name: "Floor", description: "", isActive: true });
    const table = useAppStore.getState().createTable({
      name: "T9",
      zoneId: zone.id!,
      capacity: 2,
      isActive: true,
    });
    const category = useAppStore.getState().createCategory({
      name: "Mains",
      description: "",
      image: null,
      displayOrder: 1,
      isActive: true,
    });
    const item = useAppStore.getState().createMenuItem(menuInput(category.id!, { name: "Steak" }));
    const order = useAppStore.getState().createOrder({
      tableId: table.id!,
      status: "open",
      notes: "",
      customerName: "",
      customerPhone: "",
      items: [
        {
          menuItemId: item.id!,
          categoryId: category.id!,
          name: "Steak",
          quantity: 1,
          unitPrice: 250,
        },
      ],
    });
    expect(order.ok).toBe(true);
    const removed = useAppStore.getState().deleteTable(table.id!);
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.error).toMatch(/order/i);
  });

  it("creates, edits, reorders, and deletes an unused category", () => {
    const first = useAppStore.getState().createCategory({
      name: "  Starters  ",
      description: "Small plates",
      image: null,
      displayOrder: 1,
      isActive: true,
    });
    const second = useAppStore.getState().createCategory({
      name: "Mains",
      description: "",
      image: null,
      displayOrder: 2,
      isActive: false,
    });
    expect(first.ok).toBe(true);
    expect(useAppStore.getState().categories[0].name).toBe("Starters");

    expect(
      useAppStore.getState().createCategory({
        name: "   ",
        description: "",
        image: null,
        displayOrder: 3,
        isActive: true,
      }).ok
    ).toBe(false);

    expect(
      useAppStore.getState().updateCategory(second.id!, {
        name: "Main courses",
        description: "Hot food",
        image: null,
        displayOrder: 2,
        isActive: true,
      }).ok
    ).toBe(true);

    expect(useAppStore.getState().reorderCategory(second.id!, "up").ok).toBe(true);
    const ordered = [...useAppStore.getState().categories].sort((a, b) => a.displayOrder - b.displayOrder);
    expect(ordered.map((category) => category.name)).toEqual(["Main courses", "Starters"]);

    expect(useAppStore.getState().deleteCategory(first.id!).ok).toBe(true);
    expect(useAppStore.getState().categories).toHaveLength(1);
  });

  it("blocks category deletion when a menu item still uses it", () => {
    const category = useAppStore.getState().createCategory({
      name: "Desserts",
      description: "",
      image: null,
      displayOrder: 1,
      isActive: true,
    });
    useAppStore.getState().createMenuItem(menuInput(category.id!, { name: "Cake" }));
    const removed = useAppStore.getState().deleteCategory(category.id!);
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.error).toMatch(/menu item/i);
  });

  it("creates, edits, and deletes an ingredient and rejects duplicates", () => {
    const unit = useAppStore.getState().createUnit({ name: "Gram", abbreviation: "g", isActive: true });
    expect(unit.ok).toBe(true);

    expect(
      useAppStore.getState().createIngredient({
        name: "Salt",
        description: "",
        unitId: "",
        isActive: true,
      }).ok
    ).toBe(false);
    expect(
      useAppStore.getState().createIngredient({
        name: "   ",
        description: "",
        unitId: unit.id!,
        isActive: true,
      }).ok
    ).toBe(false);

    const created = useAppStore.getState().createIngredient({
      name: "  Sea Salt  ",
      description: "Flakes",
      unitId: unit.id!,
      isActive: true,
    });
    expect(created.ok).toBe(true);
    expect(useAppStore.getState().ingredients[0].name).toBe("Sea Salt");

    const duplicate = useAppStore.getState().createIngredient({
      name: "sea salt",
      description: "",
      unitId: unit.id!,
      isActive: true,
    });
    expect(duplicate.ok).toBe(false);

    expect(
      useAppStore.getState().updateIngredient(created.id!, {
        name: "Flake salt",
        description: "",
        unitId: unit.id!,
        isActive: false,
      }).ok
    ).toBe(true);
    expect(useAppStore.getState().deleteIngredient(created.id!).ok).toBe(true);
    expect(useAppStore.getState().ingredients).toHaveLength(0);
  });

  it("blocks ingredient deletion when a recipe or inventory record still uses it", () => {
    const unit = useAppStore.getState().createUnit({ name: "Piece", abbreviation: "pcs", isActive: true });
    const ingredient = useAppStore.getState().createIngredient({
      name: "Bun",
      description: "",
      unitId: unit.id!,
      isActive: true,
    });
    const category = useAppStore.getState().createCategory({
      name: "Burgers",
      description: "",
      image: null,
      displayOrder: 1,
      isActive: true,
    });
    useAppStore.getState().createMenuItem(
      menuInput(category.id!, {
        ingredients: [{ ingredientId: ingredient.id!, quantity: 1 }],
      })
    );
    const usedInRecipe = useAppStore.getState().deleteIngredient(ingredient.id!);
    expect(usedInRecipe.ok).toBe(false);

    useAppStore.getState().deleteMenuItem(useAppStore.getState().menuItems[0].id);
    useAppStore.getState().setupInventory({
      ingredientId: ingredient.id!,
      currentStock: 10,
      minimumStock: 2,
      costPerUnit: 5,
    });
    const usedInStock = useAppStore.getState().deleteIngredient(ingredient.id!);
    expect(usedInStock.ok).toBe(false);
    if (!usedInStock.ok) expect(usedInStock.error).toMatch(/inventory/i);
  });

  it("creates a menu item with a category and ingredients, then edits and deletes it", () => {
    const unit = useAppStore.getState().createUnit({ name: "Kilogram", abbreviation: "kg", isActive: true });
    const active = useAppStore.getState().createIngredient({
      name: "Beef",
      description: "",
      unitId: unit.id!,
      isActive: true,
    });
    const inactive = useAppStore.getState().createIngredient({
      name: "Old sauce",
      description: "",
      unitId: unit.id!,
      isActive: false,
    });
    const category = useAppStore.getState().createCategory({
      name: "Mains",
      description: "",
      image: null,
      displayOrder: 1,
      isActive: true,
    });

    expect(useAppStore.getState().createMenuItem(menuInput("")).ok).toBe(false);
    expect(useAppStore.getState().createMenuItem(menuInput(category.id!, { name: "  ", price: 10 })).ok).toBe(false);
    expect(useAppStore.getState().createMenuItem(menuInput(category.id!, { price: -1 })).ok).toBe(false);
    expect(
      useAppStore.getState().createMenuItem(
        menuInput(category.id!, {
          ingredients: [
            { ingredientId: active.id!, quantity: 1 },
            { ingredientId: active.id!, quantity: 2 },
          ],
        })
      ).ok
    ).toBe(false);
    expect(
      useAppStore.getState().createMenuItem(
        menuInput(category.id!, { ingredients: [{ ingredientId: active.id!, quantity: 0 }] })
      ).ok
    ).toBe(false);

    const created = useAppStore.getState().createMenuItem(
      menuInput(category.id!, {
        name: "  House Burger  ",
        ingredients: [
          { ingredientId: active.id!, quantity: 0.15 },
          { ingredientId: inactive.id!, quantity: 0.02 },
        ],
      })
    );
    expect(created.ok).toBe(true);
    if (created.ok) expect(created.warning).toMatch(/inactive ingredient/i);
    expect(useAppStore.getState().menuItems[0].name).toBe("House Burger");
    expect(useAppStore.getState().menuItems[0].ingredients).toHaveLength(2);

    expect(
      useAppStore.getState().updateMenuItem(created.id!, menuInput(category.id!, { name: "House Burger Deluxe", price: 320 }))
        .ok
    ).toBe(true);
    expect(useAppStore.getState().toggleMenuAvailability(created.id!).ok).toBe(true);
    expect(useAppStore.getState().menuItems[0].isAvailable).toBe(false);
    expect(useAppStore.getState().deleteMenuItem(created.id!).ok).toBe(true);
  });

  it("blocks menu item deletion while it is on an open order", () => {
    const zone = useAppStore.getState().createZone({ name: "Floor", description: "", isActive: true });
    const table = useAppStore.getState().createTable({
      name: "T1",
      zoneId: zone.id!,
      capacity: 2,
      isActive: true,
    });
    const category = useAppStore.getState().createCategory({
      name: "Mains",
      description: "",
      image: null,
      displayOrder: 1,
      isActive: true,
    });
    const item = useAppStore.getState().createMenuItem(menuInput(category.id!, { name: "Pasta" }));
    useAppStore.getState().createOrder({
      tableId: table.id!,
      status: "preparing",
      notes: "",
      customerName: "",
      customerPhone: "",
      items: [
        {
          menuItemId: item.id!,
          categoryId: category.id!,
          name: "Pasta",
          quantity: 1,
          unitPrice: 250,
        },
      ],
    });
    const removed = useAppStore.getState().deleteMenuItem(item.id!);
    expect(removed.ok).toBe(false);
    if (!removed.ok) expect(removed.error).toMatch(/open or preparing/i);
  });

  it("tracks stock, updates thresholds, and records movements", () => {
    const unit = useAppStore.getState().createUnit({ name: "Litre", abbreviation: "L", isActive: true });
    const ingredient = useAppStore.getState().createIngredient({
      name: "Milk",
      description: "",
      unitId: unit.id!,
      isActive: true,
    });

    expect(
      useAppStore.getState().setupInventory({
        ingredientId: "",
        currentStock: 1,
        minimumStock: 1,
        costPerUnit: 1,
      }).ok
    ).toBe(false);
    expect(
      useAppStore.getState().setupInventory({
        ingredientId: ingredient.id!,
        currentStock: -1,
        minimumStock: 1,
        costPerUnit: 1,
      }).ok
    ).toBe(false);

    const created = useAppStore.getState().setupInventory({
      ingredientId: ingredient.id!,
      currentStock: 10,
      minimumStock: 4,
      costPerUnit: 32,
    });
    expect(created.ok).toBe(true);
    const duplicate = useAppStore.getState().setupInventory({
      ingredientId: ingredient.id!,
      currentStock: 1,
      minimumStock: 1,
      costPerUnit: 1,
    });
    expect(duplicate.ok).toBe(false);

    const record = useAppStore.getState().inventory[0];
    expect(getStockStatus(record)).toBe("in_stock");
    expect(inventoryValue(record)).toBe(320);

    expect(useAppStore.getState().addStock(record.id, 0, "empty").ok).toBe(false);
    expect(useAppStore.getState().addStock(record.id, 2.5, "Delivery").ok).toBe(true);
    expect(useAppStore.getState().inventory[0].currentStock).toBe(12.5);
    expect(useAppStore.getState().transactions[0]).toMatchObject({
      type: "IN",
      quantityChange: 2.5,
      previousStock: 10,
      newStock: 12.5,
    });

    expect(useAppStore.getState().removeStock(record.id, 100, "Waste").ok).toBe(false);
    expect(useAppStore.getState().removeStock(record.id, 12.5, "Service").ok).toBe(true);
    expect(getStockStatus(useAppStore.getState().inventory[0])).toBe("out_of_stock");

    expect(useAppStore.getState().adjustStock(record.id, -1, "Bad count").ok).toBe(false);
    expect(useAppStore.getState().adjustStock(record.id, 4, "Count").ok).toBe(true);
    expect(useAppStore.getState().inventory[0].currentStock).toBe(4);
    expect(getStockStatus(useAppStore.getState().inventory[0])).toBe("low_stock");

    expect(
      useAppStore.getState().updateInventoryMeta(record.id, { minimumStock: -1, costPerUnit: 10 }).ok
    ).toBe(false);
    expect(useAppStore.getState().updateInventoryMeta(record.id, { minimumStock: 1, costPerUnit: 40 }).ok).toBe(true);
    expect(useAppStore.getState().deleteInventory(record.id).ok).toBe(true);
    expect(useAppStore.getState().inventory).toHaveLength(0);
    expect(useAppStore.getState().transactions).toHaveLength(0);
  });

  it("classifies stock on the boundary between in stock, low stock, and out of stock", () => {
    expect(getStockStatus({ id: "a", ingredientId: "b", currentStock: 0, minimumStock: 5, costPerUnit: 1, lastUpdated: "" })).toBe(
      "out_of_stock"
    );
    expect(getStockStatus({ id: "a", ingredientId: "b", currentStock: 5, minimumStock: 5, costPerUnit: 1, lastUpdated: "" })).toBe(
      "low_stock"
    );
    expect(getStockStatus({ id: "a", ingredientId: "b", currentStock: 5.01, minimumStock: 5, costPerUnit: 1, lastUpdated: "" })).toBe(
      "in_stock"
    );
  });
});

describe("defects against the module rules", () => {
  beforeEach(resetStores);

  it("does not persist a session when remember me is off", () => {
    const error = useAuthStore.getState().login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password, false);
    expect(error).toBeNull();
    expect(useAuthStore.getState().session?.rememberMe).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("rejects a duplicate category name", () => {
    useAppStore.getState().createCategory({
      name: "Burgers",
      description: "",
      image: null,
      displayOrder: 1,
      isActive: true,
    });
    const duplicate = useAppStore.getState().createCategory({
      name: " burgers ",
      description: "",
      image: null,
      displayOrder: 2,
      isActive: true,
    });
    expect(duplicate.ok).toBe(false);
  });

  it("rejects a duplicate menu item name", () => {
    const category = useAppStore.getState().createCategory({
      name: "Mains",
      description: "",
      image: null,
      displayOrder: 1,
      isActive: true,
    });
    useAppStore.getState().createMenuItem(menuInput(category.id!, { name: "Steak" }));
    const duplicate = useAppStore.getState().createMenuItem(menuInput(category.id!, { name: " steak " }));
    expect(duplicate.ok).toBe(false);
  });

  it("rejects a table whose zone does not exist", () => {
    const result = useAppStore.getState().createTable({
      name: "Orphan",
      zoneId: "missing-zone",
      capacity: 2,
      isActive: true,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an ingredient whose unit does not exist", () => {
    const result = useAppStore.getState().createIngredient({
      name: "Ghost spice",
      description: "",
      unitId: "missing-unit",
      isActive: true,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a menu item whose category does not exist", () => {
    const result = useAppStore.getState().createMenuItem(menuInput("missing-category"));
    expect(result.ok).toBe(false);
  });

  it("rejects non-numeric capacity, price, and stock", () => {
    const zone = useAppStore.getState().createZone({ name: "Floor", description: "", isActive: true });
    const table = useAppStore.getState().createTable({
      name: "T1",
      zoneId: zone.id!,
      capacity: Number.NaN,
      isActive: true,
    });
    expect.soft(table.ok).toBe(false);

    const category = useAppStore.getState().createCategory({
      name: "Mains",
      description: "",
      image: null,
      displayOrder: 1,
      isActive: true,
    });
    expect.soft(useAppStore.getState().createMenuItem(menuInput(category.id!, { price: Number.NaN })).ok).toBe(false);

    const unit = useAppStore.getState().createUnit({ name: "Gram", abbreviation: "g", isActive: true });
    const ingredient = useAppStore.getState().createIngredient({
      name: "Salt",
      description: "",
      unitId: unit.id!,
      isActive: true,
    });
    expect.soft(
      useAppStore.getState().setupInventory({
        ingredientId: ingredient.id!,
        currentStock: Number.NaN,
        minimumStock: 1,
        costPerUnit: 1,
      }).ok
    ).toBe(false);
  });

  it("reports a missing record when an update targets an unknown id", () => {
    const result = useAppStore.getState().updateZone("missing-zone", {
      name: "Nowhere",
      description: "",
      isActive: true,
    });
    expect(result.ok).toBe(false);
  });

  it("keeps a display order of zero", () => {
    const result = useAppStore.getState().createCategory({
      name: "First",
      description: "",
      image: null,
      displayOrder: 0,
      isActive: true,
    });
    expect(result.ok).toBe(true);
    expect(useAppStore.getState().categories[0].displayOrder).toBe(0);
  });

  it("writes an opening stock transaction when an inventory record is created", () => {
    const unit = useAppStore.getState().createUnit({ name: "Kilogram", abbreviation: "kg", isActive: true });
    const ingredient = useAppStore.getState().createIngredient({
      name: "Flour",
      description: "",
      unitId: unit.id!,
      isActive: true,
    });
    const created = useAppStore.getState().setupInventory({
      ingredientId: ingredient.id!,
      currentStock: 8,
      minimumStock: 2,
      costPerUnit: 20,
    });
    expect(created.ok).toBe(true);
    const record = useAppStore.getState().inventory[0];
    const opening = useAppStore.getState().transactions.filter((tx) => tx.inventoryItemId === record.id);
    expect(opening).toHaveLength(1);
    expect(opening[0]).toMatchObject({ type: "IN", quantityChange: 8, previousStock: 0, newStock: 8 });
  });

  it("writes a stock transaction when a purchase creates a new inventory record", () => {
    const seeded = createSeedData();
    useAppStore.setState({ ...seeded, hydrated: true });
    const unitId = seeded.units[0].id;
    const ingredient = useAppStore.getState().createIngredient({
      name: "QA Spice",
      description: "",
      unitId,
      isActive: true,
    });
    const result = useAppStore.getState().createPurchase({
      supplier: "QA Supplier",
      invoiceNumber: "QA-1",
      date: "2026-11-01",
      payment: "cash",
      notes: "",
      lines: [
        {
          description: "Spice bag",
          ingredientId: ingredient.id!,
          quantity: 4,
          unitCost: 10,
          addToInventory: true,
        },
      ],
    });
    expect(result.ok).toBe(true);
    const record = useAppStore.getState().inventory.find((item) => item.ingredientId === ingredient.id);
    expect(record?.currentStock).toBe(4);
    const movements = useAppStore
      .getState()
      .transactions.filter((tx) => tx.inventoryItemId === record?.id);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ type: "IN", quantityChange: 4, newStock: 4 });
  });

  it("records a stock receipt when a purchase is posted onto an existing inventory record", () => {
    const seeded = createSeedData();
    useAppStore.setState({ ...seeded, hydrated: true });
    const existing = seeded.inventory.find((item) => {
      const ingredient = seeded.ingredients.find((row) => row.id === item.ingredientId);
      return ingredient?.name === "Chicken Breast";
    });
    if (!existing) throw new Error("seed inventory missing chicken");
    const before = existing.currentStock;
    const result = useAppStore.getState().createPurchase({
      supplier: "QA Supplier",
      invoiceNumber: "QA-2",
      date: "2026-11-01",
      payment: "cash",
      notes: "",
      lines: [
        {
          description: "Chicken delivery",
          ingredientId: existing.ingredientId,
          quantity: 2,
          unitCost: 180,
          addToInventory: true,
        },
      ],
    });
    expect(result.ok).toBe(true);
    const updated = useAppStore.getState().inventory.find((item) => item.id === existing.id);
    expect(updated?.currentStock).toBeCloseTo(before + 2);
    expect(useAppStore.getState().transactions[0]).toMatchObject({
      inventoryItemId: existing.id,
      type: "IN",
      quantityChange: 2,
    });
  });

  it("does not throw when a stock movement is given an invalid date", () => {
    const unit = useAppStore.getState().createUnit({ name: "Piece", abbreviation: "pcs", isActive: true });
    const ingredient = useAppStore.getState().createIngredient({
      name: "Napkins",
      description: "",
      unitId: unit.id!,
      isActive: true,
    });
    const record = useAppStore.getState().setupInventory({
      ingredientId: ingredient.id!,
      currentStock: 5,
      minimumStock: 1,
      costPerUnit: 1,
    });
    expect(() => useAppStore.getState().addStock(record.id!, 1, "Count", "not-a-date")).not.toThrow();
  });

  it("does not restore deleted holidays or units the next time data is loaded", () => {
    const seeded = createSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...seeded, holidays: [], units: [] }));
    const loaded = loadAppData();
    expect.soft(loaded.holidays).toEqual([]);
    expect.soft(loaded.units).toEqual([]);
  });
});
