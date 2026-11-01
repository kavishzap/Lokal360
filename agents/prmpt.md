

/qa-testing

Analyze my entire project and perform a comprehensive QA testing audit.

1. Inspect the project architecture.
2. Identify all implemented pages, components, and features.
3. Check the existing testing setup.
4. Create missing unit and integration tests.
5. Create end-to-end tests for important user flows.
6. Execute all available tests.
7. Identify bugs and potential regressions.
8. Report failures with file names and line numbers.
9. Recommend fixes without modifying production code.
10. Generate a TEST_REPORT.md file containing the results.


Use the qa-testing agent to test my POS back-office application.

Test the following modules:

- Fake login and navigation
- Zone creation, editing, and deletion
- Table creation and assignment to zones
- Menu category management
- Ingredient management
- Menu item creation with category and ingredient associations
- Inventory management

For every module, test CRUD functionality, form validation, duplicate entries, empty inputs, navigation, and edge cases.

Create automated tests using the project's existing framework. If no framework exists, recommend Vitest and Playwright where compatible.

Execute the tests, report failures, and generate TEST_REPORT.md.

Do not modify production code without my approval.

Start by analyzing the codebase and creating a testing plan before running tests.

npm install -D @playwright/test
npx playwright installnpm install -D @playwright/test
npx playwright install

npx playwright test

npx playwright show-report