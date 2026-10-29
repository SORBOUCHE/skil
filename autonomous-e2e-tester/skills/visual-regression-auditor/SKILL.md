---
name: visual-regression-auditor
displayName: Visual Regression & Snapshot Auditor
description: Execute automated pixel-level visual regression audits, manage baseline snapshots, mask volatile dynamic content, and verify layout integrity across viewports and color themes.
triggerWords:
  - "visual regression"
  - "screenshot test"
  - "visual diff"
  - "snapshot testing"
  - "responsive layout test"
  - "dark mode visual test"
  - "pixel diff"
---

# Visual Regression & Snapshot Auditor

Visual regression testing prevents subtle UI discrepancies, unwanted CSS regressions, broken layouts, and theme styling bugs from slipping into production. This guide outlines how to configure, execute, and maintain visual regression suites with Playwright.

---

## 1. Core Architecture & Diffing Engine

Playwright utilizes pixel-level diffing algorithms (powered by `pixelmatch`) comparing a captured screenshot against a committed gold-standard baseline image.

```
visual-tests/
├── baselines/
│   ├── chromium/
│   │   ├── homepage-hero-desktop.png
│   │   ├── navigation-drawer-mobile.png
│   │   └── settings-dark-mode.png
│   └── webkit/
│       └── homepage-hero-desktop.png
└── specs/
    ├── home-visual.spec.ts
    ├── components-visual.spec.ts
    └── theme-visual.spec.ts
```

### Visual Matching Formula
When Playwright evaluates `expect(page).toHaveScreenshot('snapshot.png', options)`:
1. It waits for fonts and animations to settle.
2. It captures the target bounding box (or full viewport).
3. It compares each pixel against the baseline image.
4. If the number of divergent pixels or ratio exceeds configured tolerances, the test fails and generates three artifacts:
   - `snapshot-actual.png` (the newly captured screen)
   - `snapshot-expected.png` (the committed baseline)
   - `snapshot-diff.png` (highlighted discrepancy heatmap)

---

## 2. Configuration & Tolerance Thresholds

Tune visual thresholds in `playwright.config.ts` to balance sensitivity with environmental rendering variations:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      // Allowed difference threshold between 0 (strict) and 1 (lenient)
      // 0.2 allows for anti-aliasing variations across OS font engines
      threshold: 0.2,
      
      // Maximum ratio of divergent pixels (0.01 = 1% total change permitted)
      maxDiffPixelRatio: 0.005,
      
      // Absolute pixel count tolerance
      maxDiffPixels: 50,
      
      // Automatically disable CSS animations and transitions
      animations: 'disabled',
      
      // Hide the text insertion cursor (caret) to prevent blinking caret failures
      caret: 'hide',
      
      // Force consistent scale
      scale: 'css'
    }
  }
});
```

---

## 3. Flakiness Mitigation Strategies

Visual tests are sensitive to non-deterministic UI elements. Adhere to the following rules:

### A. Font Loading Stabilization
Web fonts loaded via Google Fonts or `@font-face` may render fallback system fonts momentarily, causing layout shifts. Wait for fonts before triggering screenshots:

```typescript
export async function waitForFontsLoaded(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
```

### B. Masking Dynamic & Volatile Elements
Content like current dates, random counters, live chat avatars, and marketing banners must be masked with solid neutral placeholders:

```typescript
test('dashboard renders correctly with dynamic fields masked', async ({ page }) => {
  await page.goto('/dashboard');
  await waitForFontsLoaded(page);

  await expect(page).toHaveScreenshot('dashboard-view.png', {
    mask: [
      page.getByTestId('live-clock'),
      page.getByTestId('user-avatar'),
      page.getByTestId('unread-notifications-badge'),
      page.locator('.crypto-ticker-feed')
    ],
    maskColor: '#CBD5E1' // Neutral slate color
  });
});
```

### C. Eliminating Animation and Hover State Artifacts
Animations can be paused or accelerated via CSS injection:

```typescript
export async function disableAllCssAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        -moz-animation: none !important;
        -webkit-animation: none !important;
        animation: none !important;
        -moz-transition: none !important;
        -webkit-transition: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `
  });
}
```

---

## 4. Full-Page vs. Scoped Component Testing

Capturing entire web pages can be noisy. Scope visual checks to isolated components when verifying design system widgets:

### Full-Page Visual Audit

```typescript
test('landing page full height snapshot', async ({ page }) => {
  await page.goto('/');
  await waitForFontsLoaded(page);

  // Full-page scroll capture
  await expect(page).toHaveScreenshot('landing-page-full.png', {
    fullPage: true,
    timeout: 10000
  });
});
```

### Component-Scoped Visual Audit

```typescript
test('pricing card component visual regression', async ({ page }) => {
  await page.goto('/pricing');
  const proTierCard = page.getByTestId('pricing-tier-pro');

  await expect(proTierCard).toBeVisible();
  
  // Captures only the bounding box of the card
  await expect(proTierCard).toHaveScreenshot('pricing-card-pro.png', {
    animations: 'disabled'
  });
});
```

---

## 5. Responsive Viewport Matrix

Test layout responsiveness across standard Breakpoint categories:

```typescript
const VIEWPORTS = [
  { name: 'desktop-wide', width: 1440, height: 900 },
  { name: 'laptop-standard', width: 1280, height: 720 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile-compact', width: 375, height: 667 }
];

for (const vp of VIEWPORTS) {
  test(`hero section layout on ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    await waitForFontsLoaded(page);

    const heroSection = page.getByRole('region', { name: /hero banner/i });
    await expect(heroSection).toHaveScreenshot(`hero-${vp.name}.png`);
  });
}
```

---

## 6. Light and Dark Theme Auditing

Verify CSS color schemes, contrast, and dark mode tokens without separate code branches:

```typescript
test.describe('Theme Visual Regression', () => {
  test('settings page renders properly in Light Mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/settings');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('settings-theme-light.png');
  });

  test('settings page renders properly in Dark Mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/settings');
    await waitForFontsLoaded(page);

    await expect(page).toHaveScreenshot('settings-theme-dark.png');
  });
});
```

---

## 7. Baseline Management Workflow

### 1. Generating Initial Gold Baselines
When a visual test is newly written, run the update command to write initial snapshots to the repository:

```bash
npx playwright test --update-snapshots
```

### 2. Validating in CI
In automated CI pipelines, run tests without the update flag. Any pixel divergence triggers a job failure:

```bash
npx playwright test e2e/tests/visual/ --project=chromium
```

### 3. Reviewing Divergences & Updating
When an intentional UI redesign or layout modification occurs:
1. Inspect the HTML report to verify the diff:
   ```bash
   npx playwright show-report
   ```
2. If the visual change is intended, regenerate the baseline:
   ```bash
   npx playwright test e2e/tests/visual/ --update-snapshots
   ```
3. Commit the updated `.png` files to git.

---

## 8. Cross-Platform Font Rendering Caveat

> [!WARNING]
> Different operating systems (macOS CoreText vs Windows DirectWrite vs Linux FreeType) render fonts and anti-aliased edges with subtle differences.
> - **Best Practice**: Always execute visual regression audits inside Docker containers (`mcr.microsoft.com/playwright:v1.45.0-jammy`) or on unified CI runners (e.g. `ubuntu-latest`) to eliminate cross-platform font variance.
