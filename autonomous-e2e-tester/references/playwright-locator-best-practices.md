# Playwright Locator Best Practices & Priority Cheat Sheet

A comprehensive selector guide for writing rock-solid, resilient End-to-End tests that survive UI design refactors.

---

## 1. The Playwright Selector Priority Pyramid

Always choose the locator highest on this list that satisfies your target element:

```
▲ [Level 1] getByRole           (Highest resilience, accessibility-driven)
│ [Level 2] getByLabel          (Form control inputs, selects, switches)
│ [Level 3] getByPlaceholder    (Search bars, prompt inputs)
│ [Level 4] getByText           (Static non-interactive messages)
│ [Level 5] getByAltText        (Images, graphics, user avatars)
│ [Level 6] getByTitle          (Tooltips, svg title attributes)
│ [Level 7] getByTestId         (Deterministic escape hatch for complex widgets)
▼ [Level 8] locator (CSS/XPath) (AVOID: Highly vulnerable to styling changes)
```

---

## 2. Priority Locator Catalog with Concrete Examples

### 1. `page.getByRole(role, options)`
Reflects how assistive technology (screen readers) perceives the DOM.

```typescript
// Buttons
page.getByRole('button', { name: 'Submit Application' })
page.getByRole('button', { name: /save changes/i })

// Form Controls
page.getByRole('textbox', { name: 'Billing Address' })
page.getByRole('checkbox', { name: 'Subscribe to newsletter' })
page.getByRole('radio', { name: 'Standard Shipping' })
page.getByRole('combobox', { name: 'Choose country' })

// Headings & Landmarks
page.getByRole('heading', { level: 1, name: 'Customer Dashboard' })
page.getByRole('navigation', { name: 'Main Navigation' })
page.getByRole('dialog', { name: 'Delete Item Confirmation' })
page.getByRole('alert') // For toast messages and alert banners
page.getByRole('tab', { name: 'Security Settings' })
```

### 2. `page.getByLabel(text, options)`
Locates form controls via associated `<label for="...">` or wrapping `<label>`.

```typescript
page.getByLabel('Password')
page.getByLabel('I agree to the Terms of Service')
page.getByLabel(/email address/i)
```

### 3. `page.getByPlaceholder(text, options)`
Use when form controls lack visible `<label>` but feature explanatory placeholders (e.g., search inputs).

```typescript
page.getByPlaceholder('Search products by keyword...')
page.getByPlaceholder('e.g. name@company.com')
```

### 4. `page.getByText(text, options)`
Matches user-facing rendered text. Ideal for assertions on static copy.

```typescript
// Substring or exact match
page.getByText('Order #94827 placed successfully')
page.getByText('Total: $149.99', { exact: true })
page.getByText(/thank you/i)
```

### 5. `page.getByAltText(text, options)`
Matches elements with an `alt` attribute (typically `<img>` tags).

```typescript
page.getByAltText('Company Brand Logo')
page.getByAltText('User Profile Avatar')
```

### 6. `page.getByTestId(testId)`
Dedicated testing contract attribute (`data-testid="value"`). Use when role-based queries are ambiguous or complex Canvas/WebGL/SVG elements are used.

```typescript
// HTML: <div data-testid="interactive-flowchart-node-4">...</div>
page.getByTestId('interactive-flowchart-node-4')

// Custom attribute configuration (in playwright.config.ts):
// testIdAttribute: 'data-cy' // or 'data-qa'
```

---

## 3. Locator Chaining and Filtering

Avoid monolithic CSS queries by chaining semantic locators:

```typescript
// Target a button specifically inside an item row
const productRow = page.getByRole('listitem').filter({ hasText: 'Mechanical Keyboard' });
await productRow.getByRole('button', { name: 'Add to Cart' }).click();

// Filter locators having another descendant locator
const openCard = page.getByTestId('support-ticket').filter({
  has: page.getByRole('status', { name: 'Open' })
});
await expect(openCard).toHaveCount(3);
```

---

## 4. Anti-Patterns vs. Resilient Alternatives

| Anti-Pattern (Fragile) | Why it Breaks | Resilient Alternative (Durable) |
| :--- | :--- | :--- |
| `page.locator('.btn-primary')` | Classes change during CSS/Tailwind refactors | `page.getByRole('button', { name: 'Save' })` |
| `page.locator('div > div:nth-child(2) > a')` | Any minor layout wrapper breaks selector | `page.getByRole('link', { name: 'Learn More' })` |
| `page.locator('#submit-btn-2024')` | Dynamic ID generation breaks test | `page.getByRole('button', { name: 'Submit' })` |
| `page.locator('//button[text()="Log In"]')` | Strict XPath string equality sensitive to whitespace | `page.getByRole('button', { name: 'Log In' })` |
| `page.locator('.form-control[name="email"]')` | Tied to implementation details | `page.getByLabel('Email')` |

---

## 5. Locating in Shadow DOM & Iframes

Playwright automatically pierces standard Shadow DOM roots. For explicit iframe isolation:

```typescript
// Piercing an iframe (e.g. Stripe checkout embedded frame)
const stripeFrame = page.frameLocator('iframe[name="__privateStripeFrame"]');
await stripeFrame.getByPlaceholder('Card number').fill('4242424242424242');
await stripeFrame.getByPlaceholder('MM / YY').fill('12/28');
await stripeFrame.getByPlaceholder('CVC').fill('999');
```
