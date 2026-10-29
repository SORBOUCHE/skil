# Autonomous E2E & Visual Browser Tester - Agent Operating Rules

These operational guidelines govern all automated End-to-End (E2E), browser journey automation, and visual regression test generation executed by agents.

---

## 1. Resilient Locator Hierarchy (Strict Enforcement)

Agents MUST generate selectors adhering to the Playwright Accessibility-First Priority Tree. Never jump directly to tag names, synthetic classes, or raw structural XPath.

### Priority Ladder:
1. **Accessibility Role & Name (`page.getByRole`)**:
   - `page.getByRole('button', { name: /submit/i })`
   - `page.getByRole('heading', { level: 1, name: 'Dashboard' })`
   - `page.getByRole('textbox', { name: 'Email Address' })`
2. **Form Label Association (`page.getByLabel`)**:
   - `page.getByLabel('Password')`
   - `page.getByLabel('Accept Terms and Conditions')`
3. **Placeholder Text (`page.getByPlaceholder`)**:
   - Use only when no persistent explicit label is present (e.g. search bars):
   - `page.getByPlaceholder('Search products...')`
4. **Accessible Text Content (`page.getByText`)**:
   - For non-interactive textual verifications:
   - `page.getByText('Order #10492 confirmed')`
5. **Alt / Title Text (`page.getByAltText`, `page.getByTitle`)**:
   - For images, badges, and graphical controls:
   - `page.getByAltText('Company Logo')`
6. **Explicit Test Attributes (`page.getByTestId`)**:
   - When semantic HTML or roles are ambiguous:
   - `page.getByTestId('checkout-shipping-selector')`
   - Default attribute: `data-testid` (configurable via `playwright.config.ts`).
7. **BANNED Selector Anti-Patterns**:
   - ❌ `page.locator('.btn.btn-primary.mt-4')` (Tied to CSS styling changes).
   - ❌ `page.locator('div > div:nth-child(3) > button')` (Fragile DOM path).
   - ❌ `page.locator('xpath=//div[@id="root"]//button')` (Brittle XPath).

---

## 2. Deterministic Wait States & Auto-Waiting

Arbitrary timing halts lead to flaky test suites across environments (local vs. slow CI runners).

### Rules:
- **Zero Sleep Policy**: Never use `page.waitForTimeout(...)` or `setTimeout(...)` in test assertions or flows.
- **Web-First Assertions**: Always leverage Playwright's built-in polling assertions that automatically wait for condition satisfaction:
  ```typescript
  // CORRECT: Polling assertion with auto-retry
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
  await expect(page.getByTestId('cart-counter')).toHaveText('3');
  
  // INCORRECT: Non-retrying manual evaluation
  // const isVisible = await page.getByRole('alert').isVisible();
  // expect(isVisible).toBe(true);
  ```
- **Network Synchronization**: When asserting dynamic AJAX or GraphQL updates, wait for explicit responses rather than generic network idle:
  ```typescript
  const responsePromise = page.waitForResponse(resp => 
    resp.url().includes('/api/v1/orders') && resp.status() === 200
  );
  await page.getByRole('button', { name: 'Complete Order' }).click();
  await responsePromise;
  ```

---

## 3. Visual Regression & Snapshot Hygiene

Visual tests must be idempotent and resilient to dynamic data rendering.

### Rules:
- **Mask Dynamic Content**: Always mask elements with unpredictable contents such as live timestamps, random UUIDs, mock avatars, and real-time banners:
  ```typescript
  await expect(page).toHaveScreenshot('dashboard-overview.png', {
    mask: [
      page.getByTestId('server-timestamp'),
      page.getByTestId('user-avatar'),
      page.locator('.dynamic-advertisement')
    ],
    animations: 'disabled',
    caret: 'hide'
  });
  ```
- **Disable CSS Animations & Transitions**: Ensure tests force animations to finish or disable them to avoid micro-frame screenshot discrepancies.
- **Font Rendering Stabilization**: Guarantee web fonts have fully loaded using `document.fonts.ready` before capturing visual baselines.
- **Responsive Matrix**: Always define explicit viewports (`1280x720`, `390x844`) rather than relying on host machine screen resolution.

---

## 4. Test Isolation & Clean Tear-Down

Tests must remain completely independent to support parallel execution without cross-contamination.

### Rules:
- **Browser Context Isolation**: Every test must run within its own `BrowserContext` with fresh storage, cookies, and local cache.
- **Session Reuse via `storageState`**: Do not repeat manual UI login screens in every test. Generate a reusable authentication state in a setup fixture (`auth.setup.ts`) and ingest via `test.use({ storageState: 'playwright/.auth/user.json' })`.
- **Resource Teardown**: Close contexts and disconnect browser instances in `afterEach` or `finally` blocks, especially within custom standalone runners.
- **Artifact Retention on Failure**:
  - Automatically record Playwright Traces (`trace: 'retain-on-failure'`).
  - Capture full-page screenshots upon test failure (`screenshot: 'only-on-failure'`).
  - Retain video recordings for failed test journeys (`video: 'retain-on-failure'`).

---

## 5. Mocking & Network Resilience

- Use `page.route()` to intercept external flaky third-party integrations (payment gateways, analytics trackers, SMS providers).
- Ensure realistic mock delays or status codes (400, 401, 500) to test error handling and empty states.
- Avoid mocking your core domain APIs unless executing specialized UI component isolation tests.
