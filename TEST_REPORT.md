# QA test report

Date: 2 November 2026  
Application: B42 Bistro back office (Next.js 16, client-side Zustand store, localStorage)  
Production code was not changed. The failures below are product defects, not test setup errors.

## Testing setup

The project had no test runner, no unit tests, and no end-to-end tests.

Added, because none existed:

- Vitest 3.2.7 for store and storage tests (`npm test`)
- Playwright 1.64.1 for browser flows (`npm run test:e2e`)

Vitest 4 and 5 could not be installed with the current npm 10 and `@types/node` 20, so the suite uses Vitest 3. Tests live in `tests/unit/modules.test.ts` and `tests/e2e/back-office.spec.ts`.

## Architecture reviewed

Pages under `src/app`: login, dashboard, and dashboard modules for zones, tables, categories, units, ingredients, menu items, orders, inventory, balance inventory, accounting, reports, payroll, and settings.

Restaurant data is held in `src/store/app-store.ts` and persisted by `src/lib/storage.ts`. Login is a demo check in `src/store/auth-store.ts` against `admin@restaurant.com` / `Admin123!`. There is no backend API. Dashboard routes redirect to `/login` after the auth store hydrates.

## Execution summary

| Suite | Command | Passed | Failed | Result |
| --- | --- | --- | --- | --- |
| Unit and integration | `npx vitest run` | 17 | 13 | Failed |
| End to end (Chromium) | `npx playwright test` | 8 | 1 | Failed |

The 13 unit failures are the cases in `describe("defects against the module rules")`. They assert the rules already used by zones, ingredients, and stock movements. The matching code does not enforce those rules yet.

The end-to-end failure is the same category-duplicate defect, confirmed in the browser: both `QA Late Plates` and `qa late plates` were saved.

## Features tested

| Module | What was executed |
| --- | --- |
| Fake login and navigation | Empty password, wrong password, demo login, session restore, logout, anonymous redirect from `/` and `/dashboard/zones`, sidebar links for Zones, Tables, Categories, Ingredients, Menu Items, and Inventory |
| Zones | Create, trim, edit, case-insensitive duplicate, blank name, delete, delete blocked while a table is assigned |
| Tables | Create, zone required, capacity minimum, same name allowed in another zone, duplicate blocked in one zone, delete, delete blocked while an order exists |
| Categories | Create, blank name, edit, reorder, delete, delete blocked while a menu item exists, duplicate name |
| Ingredients | Create, blank name, missing unit, duplicate name, edit, delete, delete blocked by a recipe and by an inventory record |
| Menu items | Category required, negative price, duplicate ingredient rows, zero quantity, inactive-ingredient warning, edit, availability toggle, delete, delete blocked on an open or preparing order |
| Inventory | Setup, duplicate record, negative values, add, remove below zero, adjustment, threshold edit, delete with history, stock status boundaries, purchase posted onto existing stock |

## Tests that passed

Happy-path create, edit, and delete work for zones, tables, categories, ingredients, menu items, and inventory. Duplicate names are rejected for zones, tables in the same zone, and ingredients. Referential deletes are blocked when a zone still has tables, a table or menu item is on an open order, a category still has items, or an ingredient is used by a recipe or stock record. Stock cannot go below zero. Posting a purchase onto an ingredient that already has stock writes an `IN` transaction. Login rejects bad credentials and restores a remembered session.

End-to-end coverage that passed: login validation, route protection, module navigation, zone CRUD, table assignment, ingredient duplicate rejection, menu item creation with a category and ingredient, and an over-removal of stock.

## Tests that failed

### Unit (`tests/unit/modules.test.ts`)

| Test | Expected | Actual |
| --- | --- | --- |
| does not persist a session when remember me is off | No `localStorage` session | Session is written with `rememberMe: false` |
| rejects a duplicate category name | `ok: false` | `ok: true` |
| rejects a duplicate menu item name | `ok: false` | `ok: true` |
| rejects a table whose zone does not exist | `ok: false` | `ok: true` |
| rejects an ingredient whose unit does not exist | `ok: false` | `ok: true` |
| rejects a menu item whose category does not exist | `ok: false` | `ok: true` |
| rejects non-numeric capacity, price, and stock | `ok: false` for all three | `ok: true` for `NaN` capacity, price, and opening stock |
| reports a missing record when an update targets an unknown id | `ok: false` | `ok: true` |
| keeps a display order of zero | `displayOrder === 0` | Stored as `1` |
| writes an opening stock transaction | One `IN` transaction | No transaction |
| writes a stock transaction when a purchase creates a new inventory record | One `IN` transaction | Stock quantity is updated and no transaction is written |
| does not throw when a stock movement is given an invalid date | Handled error | `RangeError: Invalid time value` |
| does not restore deleted holidays or units the next time data is loaded | Empty arrays stay empty | Default holidays and the seven default units are written back |

### End to end

`creates a category and rejects a duplicate name` in `tests/e2e/back-office.spec.ts` (line 123). After creating `QA Late Plates`, submitting `qa late plates` shows no "already exists" message. The table contains both rows.

## Bugs

### High

1. **Remember me does not control persistence.** `src/store/auth-store.ts` lines 43-46 store `rememberMe` on the session, then always call `localStorage.setItem`. Unchecking the box still keeps the user signed in after refresh. On a shared back-office terminal that is a session-lifetime bug.  
   **Fix:** write the session to `sessionStorage` when `rememberMe` is false, and read that store during `hydrate`.

2. **The login form submits passwords in the URL when JavaScript does not handle the submit.** `src/app/login/page.tsx` line 111 is a `<form>` with no `method`. The browser default is GET. During the first end-to-end run, before hydration, the address became `/login?email=admin%40restaurant.com&password=Admin123%21`.  
   **Fix:** set `method="post"` and keep the submit button disabled until the auth store has hydrated, so a native submit cannot place the password in the query string.

### Medium

3. **Duplicate category names are allowed, including case differences.** `createCategory` at `src/store/app-store.ts` lines 398-407 checks only that the trimmed name is non-empty. `updateCategory` has the same gap. Confirmed in the browser. Zones and ingredients already reject this.  
   **Fix:** compare `name.trim().toLowerCase()` against other categories, excluding the record being edited.

4. **Duplicate menu item names are allowed.** `createMenuItem` at `src/store/app-store.ts` lines 624-628 never compares names.  
   **Fix:** use the same case-insensitive name check as ingredients.

5. **Foreign keys are not checked.** A non-empty id is enough:
   - table zone: `src/store/app-store.ts` line 327
   - ingredient unit: line 550
   - menu item category: line 627  
   **Fix:** return an error when `zones`, `units`, `categories`, or `ingredients` has no matching id. Also reject unknown ingredient ids on a recipe.

6. **`NaN` passes numeric guards.** `capacity < 1`, `price < 0`, and `currentStock < 0` are all false for `NaN` (`src/store/app-store.ts` lines 328, 628, and 725). The form schemas usually block this. The store still persists `NaN` if those checks are skipped.  
   **Fix:** reject values that are not finite, and require capacity and stock quantities to be `>= 0` only after that check.

7. **Opening stock and a first purchase receipt do not create inventory history.** `setupInventory` (`src/store/app-store.ts` lines 728-736) saves the record and no transaction. `postPurchaseLineToInventory` lines 1547-1556 create a new record in the `else` branch and leave `transactions` unchanged. Posting onto an existing record does write an `IN` transaction.  
   **Fix:** append an `IN` transaction in both paths, with `previousStock: 0` for a new record.

8. **An invalid stock date throws out of the action.** `writeStock` at `src/store/app-store.ts` line 1661 calls `new Date(date).toISOString()` with no validity check. The thrown `RangeError` skips the error toast path.  
   **Fix:** if `Number.isNaN(parsed.getTime())`, return `{ ok: false, error: "Enter a valid date." }`.

9. **Reload restores data the user deleted.** `src/lib/storage.ts` treats an empty array as missing:
   - units, line 42
   - employees, line 93
   - holidays, line 94
   - accounts, lines 86-88  
   `loadAppData` then saves that restored data. An empty holiday list comes back as the full Mauritius holiday set, and empty units come back as Kilogram, Gram, Litre, Millilitre, Piece, Pack, and Bottle.  
   **Fix:** use `??` for arrays that were saved, and only seed when the key is absent. Do not use `.length` as the signal.

10. **Updates of missing ids report success.** `updateZone` (`src/store/app-store.ts` lines 284-308) maps the list and returns `{ ok: true }` even when no zone matches. The same pattern exists for tables, categories, ingredients, menu items, and inventory settings.  
    **Fix:** if `find` returns nothing, return `{ ok: false, error: "Record not found." }` before writing.

### Low

11. **Display order `0` is replaced.** Line 406 uses `input.displayOrder || state.categories.length + 1`, so `0` becomes the next number.  
    **Fix:** use `input.displayOrder ?? state.categories.length + 1`.

12. **Category reorder exists in the store and not on the page.** `reorderCategory` is implemented, and `src/app/dashboard/categories/page.tsx` never calls it. Users cannot change display order after creation.  
    **Fix:** add up and down actions that call `reorderCategory`.

13. **Zone description cannot be entered.** `src/components/zones/zone-form.tsx` sends `zone?.description ?? ""` and the form has no description field. New zones always get an empty description.  
    **Fix:** add the description field and include it in the payload.

14. **Add and remove stock accept `0` in the form, then fail in the store.** `src/components/inventory/stock-adjustment-dialog.tsx` line 17 uses `min(0)`. `addStock` and `removeStock` reject `quantity <= 0`. Adjustment to `0` is valid, so the schema needs to depend on the mode.  
    **Fix:** require `quantity > 0` for `IN` and `OUT`.

15. **A purchase receipt replaces unit cost with the latest cost.** In the existing-inventory branch of `postPurchaseLineToInventory`, `costPerUnit` is set to `line.unitCost` rather than a weighted average. Inventory value can jump after a partial receipt.  
    **Fix:** either document last-cost as the policy or store a weighted average.

16. **Form labels are not tied to inputs.** `Field` in `src/components/shared/form-modal.tsx` lines 55-57 renders a `<label>` that does not wrap the control and has no `htmlFor`. The login labels at `src/app/login/page.tsx` lines 113-114 have the same gap. Icon-only edit, delete, and stock buttons (for example `src/app/dashboard/zones/page.tsx` lines 95-107) have no accessible name. The header search at `src/components/layout/app-header.tsx` line 76 is `readOnly` and does not search.  
    **Fix:** associate labels with controls, add `aria-label` on icon buttons, and either wire the header search or remove it.

## Remaining gaps

These were not given failing automated tests because the app does not implement the surface yet:

- No HTTP API, so request validation, HTTP status codes, and network-failure handling cannot be tested against a server.
- One demo role. There is no permission matrix to test.
- Names and descriptions have no maximum length.
- Orders, accounting, reports, and payroll were not part of the requested browser flows. The storage reload bug above does affect payroll holidays and employees.
- Mobile navigation was not automated. The menu button is icon-only, which makes that flow fragile for both assistive tech and tests.
- End-to-end tests cover Chromium only.

## Overall status

**Fail.** The main restaurant flows work: demo login, navigation, and create, edit, and delete for zones, tables, ingredients, menu items, and inventory. Duplicate protection and delete protection are in place for several of those records.

The suite is red because category and menu names can be duplicated, foreign keys and `NaN` values are accepted, inventory history is missing for new stock, remember-me is ignored, and a reload can resurrect deleted units and holidays. I have not changed production code. The fixes above need approval before they are applied.
