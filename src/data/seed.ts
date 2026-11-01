import { makeSamplePayroll } from "@/data/payroll-seed";
import { defaultCompany } from "@/lib/company";
import { placeholderImage } from "@/lib/placeholder";
import type {
  Account,
  AppData,
  Expense,
  FixedAsset,
  Ingredient,
  InventoryItem,
  InventoryTransaction,
  JournalEntry,
  MeasurementUnit,
  MenuCategory,
  MenuItem,
  Order,
  Purchase,
  RestaurantTable,
  Zone,
} from "@/types";

const id = (prefix: string, n: number) =>
  `${prefix}0000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const IDS = {
  zones: {
    indoor: id("11111111", 1),
    outdoor: id("11111111", 2),
    vip: id("11111111", 3),
    rooftop: id("11111111", 4),
  },
  categories: {
    starters: id("22222222", 1),
    mains: id("22222222", 2),
    burgers: id("22222222", 3),
    pizza: id("22222222", 4),
    pasta: id("22222222", 5),
    desserts: id("22222222", 6),
    beverages: id("22222222", 7),
    breakfast: id("22222222", 8),
  },
  units: {
    kg: id("88888888", 1),
    g: id("88888888", 2),
    L: id("88888888", 3),
    ml: id("88888888", 4),
    pcs: id("88888888", 5),
    pack: id("88888888", 6),
    bottle: id("88888888", 7),
  },
  accounts: {
    cash: id("bbbbbbbb", 1),
    bank: id("bbbbbbbb", 2),
    inventory: id("bbbbbbbb", 3),
    payable: id("bbbbbbbb", 4),
    capital: id("bbbbbbbb", 5),
    sales: id("bbbbbbbb", 6),
    purchases: id("bbbbbbbb", 7),
    expenses: id("bbbbbbbb", 8),
    fixedAssets: id("bbbbbbbb", 9),
    accumDep: id("bbbbbbbb", 10),
    depreciation: id("bbbbbbbb", 11),
  },
};

const INGREDIENT_DEFS: {
  name: string;
  description: string;
  unitKey: keyof typeof IDS.units;
}[] = [
  { name: "Chicken Breast", description: "Boneless chicken breast", unitKey: "kg" },
  { name: "Beef Patty", description: "House-ground beef patty", unitKey: "pcs" },
  { name: "Cheese", description: "Sliced cheddar cheese", unitKey: "pcs" },
  { name: "Lettuce", description: "Crisp iceberg lettuce", unitKey: "kg" },
  { name: "Tomato", description: "Ripe salad tomatoes", unitKey: "kg" },
  { name: "Onion", description: "Yellow cooking onions", unitKey: "kg" },
  { name: "Flour", description: "All-purpose wheat flour", unitKey: "kg" },
  { name: "Milk", description: "Full cream milk", unitKey: "L" },
  { name: "Sugar", description: "White caster sugar", unitKey: "kg" },
  { name: "Cooking Oil", description: "Sunflower cooking oil", unitKey: "L" },
  { name: "Beef Steak", description: "Premium sirloin steak", unitKey: "kg" },
  { name: "Salmon", description: "Fresh Atlantic salmon", unitKey: "kg" },
  { name: "Pasta", description: "Dried Italian pasta", unitKey: "kg" },
  { name: "Pizza Dough", description: "Fresh pizza dough balls", unitKey: "pcs" },
  { name: "Mozzarella", description: "Fior di latte mozzarella", unitKey: "kg" },
  { name: "Basil", description: "Fresh basil leaves", unitKey: "g" },
  { name: "Eggs", description: "Free-range eggs", unitKey: "pcs" },
  { name: "Bacon", description: "Smoked streaky bacon", unitKey: "kg" },
  { name: "Potatoes", description: "Local potatoes", unitKey: "kg" },
  { name: "Mushrooms", description: "Button mushrooms", unitKey: "kg" },
  { name: "Garlic", description: "Fresh garlic bulbs", unitKey: "kg" },
  { name: "Butter", description: "Unsalted butter", unitKey: "kg" },
  { name: "Coffee Beans", description: "Arabica coffee beans", unitKey: "kg" },
  { name: "Orange Juice", description: "Freshly squeezed orange juice", unitKey: "L" },
  { name: "Chocolate", description: "Dark couverture chocolate", unitKey: "kg" },
];

export const ingredientIds = INGREDIENT_DEFS.map((_, index) =>
  id("33333333", index + 1)
);

const created = (day: number, hour = 9) =>
  `2026-09-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;

function makeZones(): Zone[] {
  return [
    {
      id: IDS.zones.indoor,
      name: "Indoor Dining",
      description: "Main air-conditioned dining room with booth and two-top seating.",
      isActive: true,
      createdAt: created(2),
      updatedAt: created(2),
    },
    {
      id: IDS.zones.outdoor,
      name: "Outdoor Terrace",
      description: "Covered terrace overlooking the garden, popular for lunch.",
      isActive: true,
      createdAt: created(2, 10),
      updatedAt: created(2, 10),
    },
    {
      id: IDS.zones.vip,
      name: "VIP Area",
      description: "Quiet lounge for private guests and tasting menus.",
      isActive: true,
      createdAt: created(3),
      updatedAt: created(3),
    },
    {
      id: IDS.zones.rooftop,
      name: "Rooftop",
      description: "Evening rooftop seating with city views. Seasonal weather dependent.",
      isActive: false,
      createdAt: created(4),
      updatedAt: created(18),
    },
  ];
}

function makeTables(): RestaurantTable[] {
  const defs: { name: string; zoneId: string; capacity: number; day: number }[] = [
    { name: "Table 01", zoneId: IDS.zones.indoor, capacity: 2, day: 5 },
    { name: "Table 02", zoneId: IDS.zones.indoor, capacity: 4, day: 5 },
    { name: "Table 03", zoneId: IDS.zones.indoor, capacity: 4, day: 5 },
    { name: "Table 04", zoneId: IDS.zones.indoor, capacity: 6, day: 6 },
    { name: "Table 05", zoneId: IDS.zones.indoor, capacity: 8, day: 6 },
    { name: "Table 06", zoneId: IDS.zones.indoor, capacity: 2, day: 6 },
    { name: "Table 07", zoneId: IDS.zones.outdoor, capacity: 4, day: 7 },
    { name: "Table 08", zoneId: IDS.zones.outdoor, capacity: 4, day: 7 },
    { name: "Table 09", zoneId: IDS.zones.outdoor, capacity: 6, day: 7 },
    { name: "Table 10", zoneId: IDS.zones.outdoor, capacity: 2, day: 8 },
    { name: "VIP 01", zoneId: IDS.zones.vip, capacity: 4, day: 8 },
    { name: "VIP 02", zoneId: IDS.zones.vip, capacity: 6, day: 8 },
    { name: "VIP 03", zoneId: IDS.zones.vip, capacity: 8, day: 9 },
    { name: "Roof 01", zoneId: IDS.zones.rooftop, capacity: 4, day: 10 },
    { name: "Roof 02", zoneId: IDS.zones.rooftop, capacity: 6, day: 10 },
  ];

  return defs.map((table, index) => ({
    id: id("44444444", index + 1),
    name: table.name,
    zoneId: table.zoneId,
    capacity: table.capacity,
    isActive: table.zoneId !== IDS.zones.rooftop,
    createdAt: created(table.day),
    updatedAt: created(table.day),
  }));
}

function makeCategories(): MenuCategory[] {
  const defs = [
    ["Starters", "Small plates and opening courses", "#9A3412", IDS.categories.starters],
    ["Main Courses", "Signature grilled and plated mains", "#7F1D1D", IDS.categories.mains],
    ["Burgers", "House burgers on toasted brioche", "#92400E", IDS.categories.burgers],
    ["Pizza", "Wood-fired pizzas", "#B45309", IDS.categories.pizza],
    ["Pasta", "Fresh and dried pasta dishes", "#A16207", IDS.categories.pasta],
    ["Desserts", "Pastry and chocolate desserts", "#831843", IDS.categories.desserts],
    ["Beverages", "Fresh juices, coffee and house drinks", "#1E3A8A", IDS.categories.beverages],
    ["Breakfast", "Morning plates served until 11:30", "#854D0E", IDS.categories.breakfast],
  ] as const;

  return defs.map(([name, description, color, catId], index) => ({
    id: catId,
    name,
    description,
    image: placeholderImage(name, color),
    displayOrder: index + 1,
    isActive: true,
    createdAt: created(4, 8 + index),
    updatedAt: created(4, 8 + index),
  }));
}

export function makeUnits(): MeasurementUnit[] {
  const defs: { key: keyof typeof IDS.units; name: string; abbreviation: string }[] = [
    { key: "kg", name: "Kilogram", abbreviation: "kg" },
    { key: "g", name: "Gram", abbreviation: "g" },
    { key: "L", name: "Litre", abbreviation: "L" },
    { key: "ml", name: "Millilitre", abbreviation: "ml" },
    { key: "pcs", name: "Piece", abbreviation: "pcs" },
    { key: "pack", name: "Pack", abbreviation: "pack" },
    { key: "bottle", name: "Bottle", abbreviation: "bottle" },
  ];

  return defs.map((unit, index) => ({
    id: IDS.units[unit.key],
    name: unit.name,
    abbreviation: unit.abbreviation,
    isActive: true,
    createdAt: created(1, 8 + index),
    updatedAt: created(1, 8 + index),
  }));
}

function makeIngredients(): Ingredient[] {
  return INGREDIENT_DEFS.map((ingredient, index) => ({
    id: ingredientIds[index],
    name: ingredient.name,
    description: ingredient.description,
    unitId: IDS.units[ingredient.unitKey],
    isActive: ingredient.name !== "Basil",
    createdAt: created(5, 8),
    updatedAt: created(5, 8),
  }));
}

const ing = Object.fromEntries(
  INGREDIENT_DEFS.map((item, index) => [item.name, ingredientIds[index]])
) as Record<string, string>;

function recipe(
  pairs: [string, number][]
): { ingredientId: string; quantity: number }[] {
  return pairs.map(([name, quantity]) => ({
    ingredientId: ing[name],
    quantity,
  }));
}

function makeMenuItems(): MenuItem[] {
  const items: Omit<MenuItem, "id" | "createdAt" | "updatedAt">[] = [
    {
      name: "Crispy Chicken Wings",
      description: "Spiced wings with garlic oil and a light salad garnish.",
      categoryId: IDS.categories.starters,
      price: 220,
      image: placeholderImage("Wings", "#9A3412"),
      preparationTime: 18,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Chicken Breast", 0.25],
        ["Cooking Oil", 0.04],
        ["Garlic", 0.02],
        ["Lettuce", 0.03],
      ]),
    },
    {
      name: "Garden Salad",
      description: "Lettuce, tomato and onion with house oil dressing.",
      categoryId: IDS.categories.starters,
      price: 145,
      image: placeholderImage("Salad", "#3F6212"),
      preparationTime: 8,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Lettuce", 0.08],
        ["Tomato", 0.06],
        ["Onion", 0.02],
        ["Cooking Oil", 0.015],
      ]),
    },
    {
      name: "Tomato Bruschetta Bowl",
      description: "Marinated tomatoes, onion and basil oil.",
      categoryId: IDS.categories.starters,
      price: 160,
      image: placeholderImage("Tomato", "#B91C1C"),
      preparationTime: 10,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Tomato", 0.12],
        ["Onion", 0.03],
        ["Basil", 8],
        ["Cooking Oil", 0.02],
      ]),
    },
    {
      name: "Grilled Chicken Plate",
      description: "Herb chicken breast with garlic butter potatoes.",
      categoryId: IDS.categories.mains,
      price: 380,
      image: placeholderImage("Chicken", "#7F1D1D"),
      preparationTime: 22,
      isAvailable: true,
      isFeatured: true,
      ingredients: recipe([
        ["Chicken Breast", 0.22],
        ["Potatoes", 0.18],
        ["Garlic", 0.015],
        ["Butter", 0.02],
        ["Cooking Oil", 0.01],
      ]),
    },
    {
      name: "Sirloin Steak",
      description: "Grilled beef steak finished with butter and garlic.",
      categoryId: IDS.categories.mains,
      price: 620,
      image: placeholderImage("Steak", "#450A0A"),
      preparationTime: 25,
      isAvailable: true,
      isFeatured: true,
      ingredients: recipe([
        ["Beef Steak", 0.28],
        ["Butter", 0.025],
        ["Garlic", 0.01],
        ["Potatoes", 0.15],
      ]),
    },
    {
      name: "Grilled Salmon",
      description: "Salmon fillet with lemon-butter and sautéed mushrooms.",
      categoryId: IDS.categories.mains,
      price: 540,
      image: placeholderImage("Salmon", "#9F1239"),
      preparationTime: 20,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Salmon", 0.2],
        ["Butter", 0.02],
        ["Mushrooms", 0.08],
        ["Garlic", 0.01],
      ]),
    },
    {
      name: "Classic Beef Burger",
      description: "Beef patty, cheddar, lettuce, tomato and onion.",
      categoryId: IDS.categories.burgers,
      price: 265,
      image: placeholderImage("Burger", "#92400E"),
      preparationTime: 16,
      isAvailable: true,
      isFeatured: true,
      ingredients: recipe([
        ["Beef Patty", 1],
        ["Cheese", 1],
        ["Lettuce", 0.03],
        ["Tomato", 0.04],
        ["Onion", 0.02],
      ]),
    },
    {
      name: "Chicken Burger",
      description: "Grilled chicken, lettuce, cheese and tomato on brioche.",
      categoryId: IDS.categories.burgers,
      price: 250,
      image: placeholderImage("Chicken Burger", "#B45309"),
      preparationTime: 15,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Chicken Breast", 0.15],
        ["Lettuce", 0.03],
        ["Cheese", 1],
        ["Tomato", 0.04],
      ]),
    },
    {
      name: "Breakfast Burger",
      description: "Beef patty with egg, bacon and cheese.",
      categoryId: IDS.categories.burgers,
      price: 290,
      image: placeholderImage("Breakfast Burger", "#78350F"),
      preparationTime: 18,
      isAvailable: false,
      isFeatured: false,
      ingredients: recipe([
        ["Beef Patty", 1],
        ["Eggs", 1],
        ["Bacon", 0.04],
        ["Cheese", 1],
      ]),
    },
    {
      name: "Margherita Pizza",
      description: "Tomato, mozzarella and basil on wood-fired dough.",
      categoryId: IDS.categories.pizza,
      price: 310,
      image: placeholderImage("Margherita", "#B45309"),
      preparationTime: 14,
      isAvailable: true,
      isFeatured: true,
      ingredients: recipe([
        ["Pizza Dough", 1],
        ["Mozzarella", 0.12],
        ["Tomato", 0.08],
        ["Basil", 6],
      ]),
    },
    {
      name: "Beef & Onion Pizza",
      description: "Mozzarella pizza with seasoned beef and onion.",
      categoryId: IDS.categories.pizza,
      price: 360,
      image: placeholderImage("Beef Pizza", "#9A3412"),
      preparationTime: 16,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Pizza Dough", 1],
        ["Mozzarella", 0.12],
        ["Beef Steak", 0.08],
        ["Onion", 0.05],
      ]),
    },
    {
      name: "Mushroom Pizza",
      description: "Garlic mushrooms, mozzarella and butter drizzle.",
      categoryId: IDS.categories.pizza,
      price: 340,
      image: placeholderImage("Mushroom Pizza", "#57534E"),
      preparationTime: 15,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Pizza Dough", 1],
        ["Mozzarella", 0.1],
        ["Mushrooms", 0.09],
        ["Garlic", 0.015],
        ["Butter", 0.01],
      ]),
    },
    {
      name: "Spaghetti Bolognese",
      description: "Slow tomato ragù with onion, garlic and pasta.",
      categoryId: IDS.categories.pasta,
      price: 295,
      image: placeholderImage("Bolognese", "#7C2D12"),
      preparationTime: 18,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Pasta", 0.12],
        ["Beef Steak", 0.1],
        ["Tomato", 0.1],
        ["Onion", 0.04],
        ["Garlic", 0.01],
      ]),
    },
    {
      name: "Creamy Alfredo Pasta",
      description: "Pasta in a butter, milk and cheese sauce.",
      categoryId: IDS.categories.pasta,
      price: 285,
      image: placeholderImage("Alfredo", "#A16207"),
      preparationTime: 16,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Pasta", 0.12],
        ["Milk", 0.12],
        ["Cheese", 2],
        ["Butter", 0.025],
        ["Garlic", 0.01],
      ]),
    },
    {
      name: "Garlic Mushroom Pasta",
      description: "Pasta tossed with mushrooms, garlic and butter.",
      categoryId: IDS.categories.pasta,
      price: 270,
      image: placeholderImage("Mushroom Pasta", "#44403C"),
      preparationTime: 15,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Pasta", 0.12],
        ["Mushrooms", 0.1],
        ["Garlic", 0.02],
        ["Butter", 0.02],
      ]),
    },
    {
      name: "Chocolate Fondant",
      description: "Warm dark chocolate dessert with a molten centre.",
      categoryId: IDS.categories.desserts,
      price: 195,
      image: placeholderImage("Fondant", "#431407"),
      preparationTime: 14,
      isAvailable: true,
      isFeatured: true,
      ingredients: recipe([
        ["Chocolate", 0.08],
        ["Flour", 0.04],
        ["Sugar", 0.04],
        ["Eggs", 1],
        ["Butter", 0.03],
      ]),
    },
    {
      name: "Vanilla Milk Pudding",
      description: "Chilled milk pudding finished with caramel sugar.",
      categoryId: IDS.categories.desserts,
      price: 155,
      image: placeholderImage("Pudding", "#A16207"),
      preparationTime: 12,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Milk", 0.2],
        ["Sugar", 0.04],
        ["Eggs", 1],
      ]),
    },
    {
      name: "Fresh Orange Juice",
      description: "Chilled orange juice served over ice.",
      categoryId: IDS.categories.beverages,
      price: 90,
      image: placeholderImage("Orange Juice", "#C2410C"),
      preparationTime: 4,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([["Orange Juice", 0.3]]),
    },
    {
      name: "House Iced Coffee",
      description: "Cold brew coffee with milk and a touch of sugar.",
      categoryId: IDS.categories.beverages,
      price: 110,
      image: placeholderImage("Iced Coffee", "#44403C"),
      preparationTime: 5,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Coffee Beans", 0.018],
        ["Milk", 0.12],
        ["Sugar", 0.01],
      ]),
    },
    {
      name: "B42 Breakfast Plate",
      description: "Eggs, bacon, tomato, mushrooms and toasted potatoes.",
      categoryId: IDS.categories.breakfast,
      price: 245,
      image: placeholderImage("Breakfast", "#854D0E"),
      preparationTime: 16,
      isAvailable: true,
      isFeatured: false,
      ingredients: recipe([
        ["Eggs", 2],
        ["Bacon", 0.05],
        ["Tomato", 0.06],
        ["Mushrooms", 0.06],
        ["Potatoes", 0.1],
      ]),
    },
  ];

  return items.map((item, index) => ({
    ...item,
    id: id("55555555", index + 1),
    createdAt: created(12 + (index % 10), 11),
    updatedAt: created(12 + (index % 10), 11),
  }));
}

function makeInventory(ingredients: Ingredient[]): InventoryItem[] {
  const stock: Record<string, { current: number; min: number; cost: number }> = {
    "Chicken Breast": { current: 12.5, min: 4, cost: 180 },
    "Beef Patty": { current: 48, min: 20, cost: 45 },
    Cheese: { current: 80, min: 30, cost: 12 },
    Lettuce: { current: 0.6, min: 1.5, cost: 70 },
    Tomato: { current: 8.2, min: 3, cost: 55 },
    Onion: { current: 10, min: 3, cost: 40 },
    Flour: { current: 22, min: 8, cost: 28 },
    Milk: { current: 18, min: 8, cost: 32 },
    Sugar: { current: 9, min: 4, cost: 26 },
    "Cooking Oil": { current: 14, min: 5, cost: 48 },
    "Beef Steak": { current: 6.4, min: 3, cost: 420 },
    Salmon: { current: 0, min: 2, cost: 480 },
    Pasta: { current: 11, min: 4, cost: 55 },
    "Pizza Dough": { current: 36, min: 15, cost: 18 },
    Mozzarella: { current: 4.5, min: 2, cost: 210 },
    Basil: { current: 120, min: 80, cost: 0.9 },
    Eggs: { current: 64, min: 24, cost: 6 },
    Bacon: { current: 2.1, min: 2.5, cost: 260 },
    Potatoes: { current: 30, min: 10, cost: 22 },
    Mushrooms: { current: 1.2, min: 2, cost: 95 },
    Garlic: { current: 3.4, min: 1, cost: 80 },
    Butter: { current: 5.5, min: 2, cost: 140 },
    "Coffee Beans": { current: 4.8, min: 2, cost: 320 },
    "Orange Juice": { current: 0, min: 4, cost: 75 },
    Chocolate: { current: 3.2, min: 1.5, cost: 240 },
  };

  return ingredients.map((ingredient, index) => {
    const values = stock[ingredient.name];
    return {
      id: id("66666666", index + 1),
      ingredientId: ingredient.id,
      currentStock: values.current,
      minimumStock: values.min,
      costPerUnit: values.cost,
      lastUpdated: created(20, 14),
    };
  });
}

function makeTransactions(inventory: InventoryItem[]): InventoryTransaction[] {
  const byIngredient = (name: string) =>
    inventory.find((item) => item.ingredientId === ing[name])!;

  const chicken = byIngredient("Chicken Breast");
  const salmon = byIngredient("Salmon");
  const lettuce = byIngredient("Lettuce");
  const juice = byIngredient("Orange Juice");
  const bacon = byIngredient("Bacon");

  return [
    {
      id: id("77777777", 1),
      inventoryItemId: chicken.id,
      type: "IN",
      quantityChange: 8,
      previousStock: 4.5,
      newStock: 12.5,
      reason: "Weekly poultry delivery",
      createdAt: created(18, 8),
    },
    {
      id: id("77777777", 2),
      inventoryItemId: lettuce.id,
      type: "OUT",
      quantityChange: -1.4,
      previousStock: 2,
      newStock: 0.6,
      reason: "Lunch service prep",
      createdAt: created(19, 11),
    },
    {
      id: id("77777777", 3),
      inventoryItemId: salmon.id,
      type: "OUT",
      quantityChange: -2.2,
      previousStock: 2.2,
      newStock: 0,
      reason: "Weekend specials",
      createdAt: created(19, 16),
    },
    {
      id: id("77777777", 4),
      inventoryItemId: juice.id,
      type: "ADJUSTMENT",
      quantityChange: 0,
      previousStock: 1.5,
      newStock: 0,
      reason: "Spoilage write-off after cooler fault",
      createdAt: created(20, 7),
    },
    {
      id: id("77777777", 5),
      inventoryItemId: bacon.id,
      type: "IN",
      quantityChange: 2,
      previousStock: 0.1,
      newStock: 2.1,
      reason: "Emergency restock",
      createdAt: created(20, 9),
    },
    {
      id: id("77777777", 6),
      inventoryItemId: byIngredient("Pizza Dough").id,
      type: "IN",
      quantityChange: 20,
      previousStock: 16,
      newStock: 36,
      reason: "Bakery delivery",
      createdAt: created(20, 10),
    },
  ];
}

export function createSampleOrders(tables: RestaurantTable[], menuItems: MenuItem[]): Order[] {
  const byTable = (name: string) => tables.find((table) => table.name === name);
  const byMenu = (name: string) => menuItems.find((item) => item.name === name);
  const table01 = byTable("Table 01");
  const table02 = byTable("Table 02");
  const table07 = byTable("Table 07");
  const vip01 = byTable("VIP 01");
  const chickenBurger = byMenu("Chicken Burger");
  const beefBurger = byMenu("Classic Beef Burger");
  const wings = byMenu("Crispy Chicken Wings");
  const salad = byMenu("Garden Salad");
  const pizza = byMenu("Margherita Pizza");
  const juice = byMenu("Fresh Orange Juice");
  const steak = byMenu("Sirloin Steak");
  const coffee = byMenu("House Iced Coffee");

  if (!table01 || !table02 || !table07 || !vip01) return [];
  if (!chickenBurger || !beefBurger || !wings || !salad || !pizza || !juice || !steak || !coffee) {
    return [];
  }

  const line = (
    item: MenuItem,
    quantity: number,
    index: number
  ): Order["items"][number] => ({
    id: id("99999999", index),
    menuItemId: item.id,
    categoryId: item.categoryId,
    name: item.name,
    quantity,
    unitPrice: item.price,
  });

  return [
    {
      id: id("aaaaaaa1", 1),
      orderNumber: "ORD-1001",
      tableId: table01.id,
      zoneId: table01.zoneId,
      status: "preparing",
      notes: "No onions on the burger.",
      items: [line(chickenBurger, 2, 1), line(juice, 2, 2)],
      createdAt: created(21, 12),
      updatedAt: created(21, 12),
    },
    {
      id: id("aaaaaaa1", 2),
      orderNumber: "ORD-1002",
      tableId: table07.id,
      zoneId: table07.zoneId,
      status: "open",
      notes: "",
      items: [line(wings, 1, 3), line(salad, 1, 4), line(pizza, 1, 5)],
      createdAt: created(21, 13),
      updatedAt: created(21, 13),
    },
    {
      id: id("aaaaaaa1", 3),
      orderNumber: "ORD-1003",
      tableId: vip01.id,
      zoneId: vip01.zoneId,
      status: "served",
      notes: "VIP tasting table.",
      items: [line(steak, 2, 6), line(coffee, 2, 7)],
      createdAt: created(20, 19),
      updatedAt: created(20, 20),
    },
    {
      id: id("aaaaaaa1", 4),
      orderNumber: "ORD-1004",
      tableId: table02.id,
      zoneId: table02.zoneId,
      status: "completed",
      notes: "",
      items: [line(beefBurger, 1, 8), line(juice, 1, 9)],
      createdAt: created(20, 11),
      updatedAt: created(20, 12),
    },
  ];
}

export function makeAccounts(): Account[] {
  const defs: {
    key: keyof typeof IDS.accounts;
    code: string;
    name: string;
    type: Account["type"];
    isCash: boolean;
  }[] = [
    { key: "cash", code: "1000", name: "Cash on hand", type: "asset", isCash: true },
    { key: "bank", code: "1010", name: "Bank", type: "asset", isCash: true },
    { key: "inventory", code: "1100", name: "Inventory", type: "asset", isCash: false },
    { key: "fixedAssets", code: "1200", name: "Fixed assets", type: "asset", isCash: false },
    { key: "accumDep", code: "1205", name: "Accumulated depreciation", type: "asset", isCash: false },
    { key: "payable", code: "2000", name: "Accounts payable", type: "liability", isCash: false },
    { key: "capital", code: "3000", name: "Owner's capital", type: "equity", isCash: false },
    { key: "sales", code: "4000", name: "Food sales", type: "income", isCash: false },
    { key: "purchases", code: "5000", name: "Food purchases", type: "expense", isCash: false },
    { key: "expenses", code: "5100", name: "Operating expenses", type: "expense", isCash: false },
    { key: "depreciation", code: "5200", name: "Depreciation", type: "expense", isCash: false },
  ];

  return defs.map((account) => ({
    id: IDS.accounts[account.key],
    code: account.code,
    name: account.name,
    type: account.type,
    isCash: account.isCash,
    isSystem: true,
    isActive: true,
    createdAt: created(1),
    updatedAt: created(1),
  }));
}

export function ensureSystemAccounts(accounts: Account[]) {
  const existing = new Set(accounts.map((account) => account.code));
  const missing = makeAccounts().filter((account) => !existing.has(account.code));
  return [...accounts, ...missing].sort((a, b) => a.code.localeCompare(b.code));
}

function journalLine(
  n: number,
  accountId: string,
  debit: number,
  credit: number,
  description = ""
) {
  return {
    id: id("ccccccc1", n),
    accountId,
    description,
    debit,
    credit,
  };
}

export function makeSampleAccounting(ingredients: Ingredient[]): {
  accounts: Account[];
  journalEntries: JournalEntry[];
  purchases: Purchase[];
  expenses: Expense[];
  assets: FixedAsset[];
} {
  const accounts = makeAccounts();
  const opening: JournalEntry = {
    id: id("dddddddd", 1),
    number: "JNL-1001",
    date: "2026-09-01",
    description: "Opening balances",
    source: "manual",
    sourceId: null,
    lines: [
      journalLine(1, IDS.accounts.cash, 25000, 0, "Opening cash"),
      journalLine(2, IDS.accounts.bank, 80000, 0, "Opening bank"),
      journalLine(3, IDS.accounts.inventory, 45000, 0, "Opening stock"),
      journalLine(4, IDS.accounts.capital, 0, 150000, "Owner's capital"),
    ],
    createdAt: created(1),
  };

  const flour = ingredients.find((item) => item.name === "Flour");
  const oil = ingredients.find((item) => item.name === "Cooking Oil");
  const purchase: Purchase = {
    id: id("eeeeeeee", 1),
    number: "PUR-1001",
    supplier: "Island Foods Ltd",
    invoiceNumber: "INV-4421",
    date: "2026-09-18",
    payment: "credit",
    notes: "Weekly dry goods. Post remaining lines to inventory after checking the delivery.",
    lines: [
      {
        id: id("ffffff01", 1),
        description: "Flour",
        ingredientId: flour?.id ?? null,
        quantity: 25,
        unitCost: 48,
        postedToInventory: false,
      },
      {
        id: id("ffffff01", 2),
        description: "Cooking Oil",
        ingredientId: oil?.id ?? null,
        quantity: 10,
        unitCost: 95,
        postedToInventory: false,
      },
    ],
    journalEntryId: id("dddddddd", 2),
    createdAt: created(18, 11),
    updatedAt: created(18, 11),
  };

  const purchaseJournal: JournalEntry = {
    id: id("dddddddd", 2),
    number: "JNL-1002",
    date: "2026-09-18",
    description: "Purchase PUR-1001 Island Foods Ltd",
    source: "purchase",
    sourceId: purchase.id,
    lines: [
      journalLine(5, IDS.accounts.purchases, 2150, 0, "Food purchases"),
      journalLine(6, IDS.accounts.payable, 0, 2150, "Island Foods Ltd"),
    ],
    createdAt: created(18, 11),
  };

  const expense: Expense = {
    id: id("eeeeeeee", 2),
    number: "EXP-1001",
    payee: "CEB",
    reference: "EL-SEP-26",
    date: "2026-09-20",
    payment: "bank",
    notes: "September electricity.",
    lines: [
      {
        id: id("ffffff02", 1),
        description: "Electricity",
        accountId: IDS.accounts.expenses,
        amount: 4200,
      },
    ],
    journalEntryId: id("dddddddd", 3),
    createdAt: created(20, 9),
    updatedAt: created(20, 9),
  };

  const expenseJournal: JournalEntry = {
    id: id("dddddddd", 3),
    number: "JNL-1003",
    date: "2026-09-20",
    description: "Expense EXP-1001 CEB",
    source: "expense",
    sourceId: expense.id,
    lines: [
      journalLine(7, IDS.accounts.expenses, 4200, 0, "Electricity"),
      journalLine(8, IDS.accounts.bank, 0, 4200, "CEB"),
    ],
    createdAt: created(20, 9),
  };

  const van: FixedAsset = {
    id: id("eeeeeeee", 3),
    number: "AST-1001",
    name: "Toyota Hiace delivery van",
    category: "vehicle",
    acquiredOn: "2026-01-15",
    cost: 480000,
    funding: "capital",
    depreciates: true,
    usefulLifeMonths: 60,
    residualValue: 48000,
    accumulatedDepreciation: 72000,
    lastDepreciationDate: "2026-10-31",
    notes: "Owner-contributed vehicle used for market runs and staff transport.",
    journalEntryId: id("dddddddd", 4),
    createdAt: created(15, 10),
    updatedAt: "2026-10-31T09:00:00.000Z",
  };

  const oven: FixedAsset = {
    id: id("eeeeeeee", 4),
    number: "AST-1002",
    name: "Rational combi oven",
    category: "kitchen",
    acquiredOn: "2026-04-01",
    cost: 85000,
    funding: "bank",
    depreciates: true,
    usefulLifeMonths: 96,
    residualValue: 5000,
    accumulatedDepreciation: 5833.31,
    lastDepreciationDate: "2026-10-31",
    notes: "Main kitchen oven.",
    journalEntryId: id("dddddddd", 6),
    createdAt: created(1, 11),
    updatedAt: "2026-10-31T09:00:00.000Z",
  };

  const land: FixedAsset = {
    id: id("eeeeeeee", 5),
    number: "AST-1003",
    name: "Staff parking plot",
    category: "land",
    acquiredOn: "2026-02-01",
    cost: 250000,
    funding: "capital",
    depreciates: false,
    usefulLifeMonths: 0,
    residualValue: 0,
    accumulatedDepreciation: 0,
    lastDepreciationDate: null,
    notes: "Land is not depreciated.",
    journalEntryId: id("dddddddd", 8),
    createdAt: created(2, 10),
    updatedAt: created(2, 10),
  };

  const vanJournal: JournalEntry = {
    id: id("dddddddd", 4),
    number: "JNL-1004",
    date: "2026-01-15",
    description: "Asset AST-1001 Toyota Hiace delivery van",
    source: "asset",
    sourceId: van.id,
    lines: [
      journalLine(9, IDS.accounts.fixedAssets, 480000, 0, van.name),
      journalLine(10, IDS.accounts.capital, 0, 480000, "Owner contribution"),
    ],
    createdAt: created(15, 10),
  };

  const vanDepJournal: JournalEntry = {
    id: id("dddddddd", 5),
    number: "JNL-1005",
    date: "2026-10-31",
    description: "Depreciation AST-1001 Toyota Hiace delivery van",
    source: "depreciation",
    sourceId: van.id,
    lines: [
      journalLine(11, IDS.accounts.depreciation, 72000, 0, "Straight-line depreciation"),
      journalLine(12, IDS.accounts.accumDep, 0, 72000, van.name),
    ],
    createdAt: "2026-10-31T09:00:00.000Z",
  };

  const ovenJournal: JournalEntry = {
    id: id("dddddddd", 6),
    number: "JNL-1006",
    date: "2026-04-01",
    description: "Asset AST-1002 Rational combi oven",
    source: "asset",
    sourceId: oven.id,
    lines: [
      journalLine(13, IDS.accounts.fixedAssets, 85000, 0, oven.name),
      journalLine(14, IDS.accounts.bank, 0, 85000, oven.name),
    ],
    createdAt: created(1, 11),
  };

  const ovenDepJournal: JournalEntry = {
    id: id("dddddddd", 7),
    number: "JNL-1007",
    date: "2026-10-31",
    description: "Depreciation AST-1002 Rational combi oven",
    source: "depreciation",
    sourceId: oven.id,
    lines: [
      journalLine(15, IDS.accounts.depreciation, 5833.31, 0, "Straight-line depreciation"),
      journalLine(16, IDS.accounts.accumDep, 0, 5833.31, oven.name),
    ],
    createdAt: "2026-10-31T09:00:00.000Z",
  };

  const landJournal: JournalEntry = {
    id: id("dddddddd", 8),
    number: "JNL-1008",
    date: "2026-02-01",
    description: "Asset AST-1003 Staff parking plot",
    source: "asset",
    sourceId: land.id,
    lines: [
      journalLine(17, IDS.accounts.fixedAssets, 250000, 0, land.name),
      journalLine(18, IDS.accounts.capital, 0, 250000, "Owner contribution"),
    ],
    createdAt: created(2, 10),
  };

  return {
    accounts,
    journalEntries: [
      opening,
      purchaseJournal,
      expenseJournal,
      vanJournal,
      vanDepJournal,
      ovenJournal,
      ovenDepJournal,
      landJournal,
    ],
    purchases: [purchase],
    expenses: [expense],
    assets: [van, oven, land],
  };
}

export function createSeedData(): AppData {
  const zones = makeZones();
  const tables = makeTables();
  const categories = makeCategories();
  const units = makeUnits();
  const ingredients = makeIngredients();
  const menuItems = makeMenuItems();
  const inventory = makeInventory(ingredients);
  const transactions = makeTransactions(inventory);
  const orders = createSampleOrders(tables, menuItems);
  const accounting = makeSampleAccounting(ingredients);
  const payroll = makeSamplePayroll();

  return {
    zones,
    tables,
    categories,
    units,
    ingredients,
    menuItems,
    inventory,
    transactions,
    orders,
    ...accounting,
    ...payroll,
    company: defaultCompany(),
  };
}
