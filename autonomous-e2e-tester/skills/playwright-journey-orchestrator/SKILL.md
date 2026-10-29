---
name: playwright-journey-orchestrator
displayName: Playwright User Journey Orchestrator
description: Architect, design, and execute resilient multi-step user journeys, Page Object Models (POM), network mocking, and cross-device testing with Playwright.
triggerWords:
  - "playwright"
  - "user journey"
  - "e2e test"
  - "page object model"
  - "pom"
  - "browser test"
  - "headless test"
  - "mock api"
  - "test suite"
---

# Playwright User Journey Orchestrator

This skill guides the design, structure, and execution of resilient, production-grade End-to-End (E2E) browser automation suites. It establishes standards for Page Object Models (POM), stateful multi-step user journeys, network mocking, and multi-device matrix execution.

---

## 1. Core Architecture: The Modular E2E Hierarchy

A production-ready E2E test suite adheres to strict separation between **Page Objects**, **Test Fixtures**, **Network Interceptors**, and **Journey Specs**:

```
e2e/
├── fixtures/
│   ├── base-fixture.ts         # Extended test runner with custom POM injection
│   └── auth.setup.ts           # Global authentication and storageState persistence
├── pages/
│   ├── base.page.ts            # Common navigation, header, toast utilities
│   ├── auth.page.ts            # Login, registration, MFA interactions
│   ├── catalog.page.ts         # Product listings, filtering, search
│   ├── checkout.page.ts        # Shipping, billing, payment submission
│   └── settings.page.ts        # User preferences, profile management
├── mocks/
│   ├── payments.mock.ts        # Mock definitions for Stripe / PayPal webhooks
│   └── user-profile.json       # Mock payloads for user state
├── tests/
│   ├── journeys/
│   │   ├── guest-checkout.spec.ts
│   │   ├── auth-user-flow.spec.ts
│   │   └── account-settings.spec.ts
│   └── visual/
└── playwright.config.ts        # Matrix devices, workers, trace & reporter configuration
```

---

## 2. Page Object Model (POM) Design Patterns

Page Object Models encapsulate DOM structure and user interactions. Tests express intent ("what the user does"), while Page Objects express mechanics ("how the UI behaves").

### Base Page (`e2e/pages/base.page.ts`)

```typescript
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly globalSpinner: Locator;
  readonly toastNotification: Locator;
  readonly userNavMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.globalSpinner = page.getByRole('progressbar', { name: /loading/i });
    this.toastNotification = page.getByRole('status');
    this.userNavMenu = page.getByRole('button', { name: /account menu/i });
  }

  async waitForAppReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    if (await this.globalSpinner.count() > 0) {
      await expect(this.globalSpinner).toBeHidden({ timeout: 10000 });
    }
  }

  async expectToastMessage(expectedText: string | RegExp): Promise<void> {
    await expect(this.toastNotification).toBeVisible();
    await expect(this.toastNotification).toContainText(expectedText);
  }
}
```

### Authentication Page (`e2e/pages/auth.page.ts`)

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AuthPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /sign in|log in/i });
    this.errorMessage = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForAppReady();
  }

  async login(email: string, pass: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async expectLoginError(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### Checkout & Cart Page (`e2e/pages/checkout.page.ts`)

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export class CheckoutPage extends BasePage {
  readonly recipientInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly zipInput: Locator;
  readonly countrySelect: Locator;
  readonly continueToPaymentBtn: Locator;
  readonly placeOrderBtn: Locator;
  readonly orderSuccessHeader: Locator;
  readonly orderNumberBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.recipientInput = page.getByRole('textbox', { name: /full name|recipient/i });
    this.streetInput = page.getByRole('textbox', { name: /street address/i });
    this.cityInput = page.getByRole('textbox', { name: /city/i });
    this.zipInput = page.getByRole('textbox', { name: /postal code|zip/i });
    this.countrySelect = page.getByRole('combobox', { name: /country/i });
    this.continueToPaymentBtn = page.getByRole('button', { name: /continue to payment/i });
    this.placeOrderBtn = page.getByRole('button', { name: /place order|complete purchase/i });
    this.orderSuccessHeader = page.getByRole('heading', { level: 1, name: /thank you for your order/i });
    this.orderNumberBadge = page.getByTestId('order-id-display');
  }

  async fillShippingDetails(address: ShippingAddress): Promise<void> {
    await this.recipientInput.fill(address.fullName);
    await this.streetInput.fill(address.street);
    await this.cityInput.fill(address.city);
    await this.zipInput.fill(address.zipCode);
    await this.countrySelect.selectOption({ label: address.country });
    await this.continueToPaymentBtn.click();
  }

  async completeOrder(): Promise<string> {
    await this.placeOrderBtn.click();
    await expect(this.orderSuccessHeader).toBeVisible({ timeout: 15000 });
    const orderNumber = await this.orderNumberBadge.textContent();
    return orderNumber ? orderNumber.trim() : '';
  }
}
```

---

## 3. Session Reusability with Storage State

Rather than executing the UI login flow in every single test, authenticate once during a pre-test setup phase and persist cookies/tokens:

### Auth Setup (`e2e/fixtures/auth.setup.ts`)

```typescript
import { test as setup, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

const authFile = 'playwright/.auth/user.json';

setup('authenticate user session', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.goto();
  await authPage.login(
    process.env.TEST_USER_EMAIL || 'testuser@example.com',
    process.env.TEST_USER_PASSWORD || 'SecureP@ssw0rd123!'
  );

  // Verify successful authentication redirect
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();

  // Persist cookies and local storage tokens to disk
  await page.context().storageState({ path: authFile });
});
```

---

## 4. Multi-Step User Journey Implementation

Here is an end-to-end user journey chaining authentication state, product discovery, dynamic cart interaction, and checkout verification:

```typescript
import { test, expect } from '@playwright/test';
import { CatalogPage } from '../pages/catalog.page';
import { CheckoutPage } from '../pages/checkout.page';

test.describe('E-Commerce Purchase Journey', () => {
  // Use saved authenticated session
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('user searches for item, adds to cart, and completes checkout', async ({ page }) => {
    const catalog = new CatalogPage(page);
    const checkout = new CheckoutPage(page);

    // 1. Browse and filter
    await catalog.goto();
    await catalog.search('Mechanical Keyboard');
    await catalog.filterByCategory('Electronics');
    
    // 2. Select product and inspect details
    const productCard = catalog.getProductCard('Ergonomic RGB Keyboard');
    await expect(productCard).toBeVisible();
    await catalog.addToCart('Ergonomic RGB Keyboard');

    // 3. Verify cart state update
    await expect(page.getByTestId('cart-item-count')).toHaveText('1');
    await catalog.openCartDrawer();
    await expect(page.getByRole('dialog', { name: /shopping cart/i })).toBeVisible();

    // 4. Proceed to checkout
    await page.getByRole('button', { name: /proceed to checkout/i }).click();

    // 5. Complete shipping & review
    await checkout.fillShippingDetails({
      fullName: 'Alex Rivera',
      street: '100 Innovation Way',
      city: 'Austin',
      zipCode: '78701',
      country: 'United States'
    });

    const orderId = await checkout.completeOrder();
    expect(orderId).toMatch(/^ORD-[0-9]{5,8}$/);
  });
});
```

---

## 5. Network Mocking & API Interception (`page.route`)

Playwright enables deep mocking of HTTP requests to test edge cases, error states, and uncouple tests from third-party services.

### Mocking Payment Gateway Responses

```typescript
test('handles payment gateway timeout gracefully', async ({ page }) => {
  // Intercept the payment gateway call
  await page.route('**/api/v1/payments/charge', async (route) => {
    // Simulate gateway 504 Gateway Timeout
    await route.fulfill({
      status: 504,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'GATEWAY_TIMEOUT',
        message: 'Payment processor took too long to respond. Please try again.'
      })
    });
  });

  const checkout = new CheckoutPage(page);
  await checkout.triggerPayment();

  // Assert user is alerted without losing form state
  await expect(page.getByRole('alert')).toContainText(/took too long to respond/i);
  await expect(checkout.placeOrderBtn).toBeEnabled();
});
```

### Modifying Live Responses on the Fly

```typescript
test('injects premium user permissions into live response', async ({ page }) => {
  await page.route('**/api/user/me', async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    
    // Mutate role to admin/premium
    json.roles = ['ADMIN', 'PREMIUM_TIER'];
    json.features = { betaAnalytics: true, unlimitedExports: true };

    await route.fulfill({ response, json });
  });

  await page.goto('/settings');
  await expect(page.getByRole('tab', { name: /beta analytics/i })).toBeVisible();
});
```

---

## 6. Multi-Device & Cross-Browser Configuration

Configure matrix execution across Desktop Chrome, Firefox, WebKit, and mobile emulations in `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/test-results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 20000
  },
  projects: [
    // 0. Setup project for auth
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/
    },

    // 1. Desktop Google Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    },

    // 2. Desktop Mozilla Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup']
    },

    // 3. Desktop Apple Safari (WebKit)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup']
    },

    // 4. Mobile Safari (iPhone 14)
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      dependencies: ['setup']
    },

    // 5. Mobile Chrome (Pixel 7)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup']
    }
  ]
});
```

---

## 7. Headless Execution & CLI Troubleshooting

Run suites with granular filtering, tracing, and debugging:

```bash
# Execute full headless suite across all projects
npx playwright test

# Run a specific user journey in Chromium
npx playwright test e2e/tests/journeys/guest-checkout.spec.ts --project=chromium

# Run in headed mode with slow-motion for visual debugging
npx playwright test --headed --slowmo=200

# Inspect captured trace file from a failed run
npx playwright show-trace test-results/failed-test/trace.zip

# Run with interactive UI mode
npx playwright test --ui
```

---

## 8. Anti-Patterns & Best Practices Checklist

| Area | ❌ Anti-Pattern | ✅ Resilient Standard |
| :--- | :--- | :--- |
| **Locators** | Relying on CSS `.btn-primary` or auto-generated Tailwind classes | Using `page.getByRole('button', { name: 'Save' })` |
| **Waits** | `await page.waitForTimeout(3000)` | `await expect(locator).toBeVisible()` |
| **Auth** | Performing complete UI login in `beforeEach` for 50 tests | Persisting `storageState` with setup dependencies |
| **Assertions** | `expect(await locator.count()).toBe(1)` | `await expect(locator).toHaveCount(1)` |
| **Isolation** | Tests relying on data created by preceding tests | Autonomous test setup with independent test fixtures |
