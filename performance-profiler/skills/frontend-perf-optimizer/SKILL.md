---
name: frontend-perf-optimizer
description: Optimizes Core Web Vitals (LCP, INP, CLS), shrinks bundle sizes, resolves UI jank, and accelerates critical rendering paths.
---

# Frontend Performance Optimizer Skill

Expert engineering guide to diagnosing, profiling, and resolving frontend web performance bottlenecks, optimizing Core Web Vitals, shrinking bundle sizes, and building 60 FPS user interfaces.

---

## 1. When to Activate This Skill

Activate this skill whenever the user or system observes:
- Slow initial page load, high Time to First Byte (TTFB), or slow First Contentful Paint (FCP).
- Poor Core Web Vitals metrics reported in Google Search Console, PageSpeed Insights, or Chrome UX Report (CrUX).
- Low Lighthouse scores (< 90 in Performance category).
- JavaScript bundle size warnings or bloated bundle size reports (> 1MB initial chunk).
- UI jank, stutter, high input delay, or unresponsive interactions when clicking, typing, or scrolling.
- Requests to optimize React, Vue, Next.js, Nuxt, or Vite frontend applications.

---

## 2. Core Web Vitals Deep Dive & Remedies

### A. LCP (Largest Contentful Paint)
**Target: < 2.5s** (Good threshold at p75)
- **Definition**: Time taken to render the largest visible image, video poster, or text block in the viewport.
- **Root Causes**:
  1. *Slow Server Response (High TTFB)*: Backend rendering delays, un-cached API responses, distant hosting without CDN.
  2. *Render-Blocking Resources*: External CSS stylesheets and synchronous `<script>` tags in `<head>`.
  3. *Slow Resource Load Times*: Massive uncompressed hero images, late-discovered images in CSS (`background-image`), or images loaded via client-side fetch.
  4. *Client-Side Rendering (CSR) Delays*: Blank HTML waiting for massive JS bundle execution before rendering the hero element.
- **Remedies & Code Patterns**:
  - **Preload Critical Hero Images**:
    ```html
    <link rel="preload" fetchpriority="high" as="image" href="/images/hero.webp" type="image/webp">
    ```
  - **Eliminate Render Blocking**:
    ```html
    <!-- Defer non-critical scripts -->
    <script src="/bundle.js" defer></script>
    <!-- Inline critical CSS, load non-critical asynchronously -->
    <link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    ```
  - **Implement Modern Image Formats**: Convert PNG/JPEG to WebP/AVIF.
  - **Adopt SSR/SSG/ISR**: Pre-render HTML on server or at build time for instant visual content delivery.

---

### B. INP (Interaction to Next Paint)
**Target: < 200ms** (Replaces FID since March 2024)
- **Definition**: Measures overall responsiveness throughout the entire page lifecycle by recording the latency of all user clicks, taps, and key presses, picking the worst (or near-worst) delay.
- **Root Causes**:
  1. *Long Tasks (> 50ms) on Main Thread*: Heavy synchronous loops, un-debounced event handlers, or massive JSON parsing.
  2. *Extensive Re-rendering*: Large React component subtrees re-rendering on every keypress or mouse movement.
  3. *Main Thread Starvation*: Third-party tracking scripts and analytics executing during user interaction.
- **Remedies & Code Patterns**:
  - **Yielding to the Main Thread via `scheduler.yield()` or `setTimeout`**:
    ```typescript
    async function processHeavyBatch(items: Item[]) {
      for (const item of items) {
        processItem(item);
        // Yield to allow browser to handle pending paints and input events
        if ('scheduler' in window && 'yield' in (window as any).scheduler) {
          await (window as any).scheduler.yield();
        } else {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    ```
  - **Use React 18 Transitions (`useTransition` / `startTransition`)**:
    ```tsx
    const [isPending, startTransition] = useTransition();

    function handleFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
      setQuery(e.target.value); // Urgent: immediate feedback in input box
      startTransition(() => {
        setFilteredList(filterData(e.target.value)); // Non-urgent: can be deferred
      });
    }
    ```
  - **Debounce/Throttle High-Frequency Events**:
    Use `requestAnimationFrame` or lodash throttle for resize/scroll handlers.

---

### C. CLS (Cumulative Layout Shift)
**Target: < 0.1**
- **Definition**: Measures visual stability by summing unexpected layout shift scores for every visible element that suddenly changes position.
- **Root Causes**:
  1. *Images and Video Without Dimensions*: Missing `width` and `height` attributes causing reflow when assets finish downloading.
  2. *Dynamically Injected Content*: Ads, cookie banners, or promotional ribbons inserted above already rendered content.
  3. *FOUT (Flash of Unstyled Text) / FOIT (Flash of Invisible Text)*: Custom web fonts loading late and swapping with system fallback fonts having different metric sizes.
- **Remedies & Code Patterns**:
  - **Always Reserve Aspect Ratio & Dimensions**:
    ```html
    <!-- Explicit HTML dimensions allow browser to allocate layout box immediately -->
    <img src="/hero.webp" width="1200" height="630" alt="Hero banner" class="hero-img">
    ```
    ```css
    .hero-img {
      width: 100%;
      height: auto;
      aspect-ratio: 1200 / 630;
    }
    ```
  - **Reserve Space for Injected Elements / Ads**:
    ```css
    .ad-slot-container {
      min-height: 250px;
      width: 300px;
      contain: layout style;
    }
    ```
  - **Font Fallback Metric Matching**:
    Use `font-display: swap` combined with `@font-face` overrides (`ascent-override`, `descent-override`, `size-adjust`) to ensure fallback font dimensions align with the custom web font.

---

## 3. Bundle Analysis & Code Splitting Workflow

### A. Analysis Tooling
1. **Vite Projects**:
   ```bash
   npm install --save-dev rollup-plugin-visualizer
   ```
   In `vite.config.ts`:
   ```typescript
   import { visualizer } from 'rollup-plugin-visualizer';
   export default defineConfig({
     plugins: [visualizer({ open: true, filename: 'bundle-stats.html', gzipSize: true })]
   });
   ```
2. **Next.js Projects**:
   ```bash
   npm install @next/bundle-analyzer
   ```
   In `next.config.js`:
   ```javascript
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   });
   module.exports = withBundleAnalyzer({});
   ```
3. **General Inspection**:
   Run `npx source-map-explorer dist/**/*.js` to inspect production source maps.

### B. Splitting Strategies
- **Route-Based Splitting**:
  Every route should be its own chunk.
  ```tsx
  // React Router example
  import { lazy, Suspense } from 'react';
  const Dashboard = lazy(() => import('./pages/Dashboard'));
  const Settings = lazy(() => import('./pages/Settings'));

  export function AppRoutes() {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    );
  }
  ```
- **Heavy Component & Modal Lazy Loading**:
  Do not bundle PDF renderers, charting libraries (Chart.js, Recharts), rich text editors (Monaco, TipTap) into the main bundle:
  ```tsx
  const ChartModal = lazy(() => import('./components/AnalyticsChart'));
  ```
- **Vendor Chunk Splitting (Vite)**:
  ```typescript
  // vite.config.ts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          utils: ['date-fns', 'lodash-es']
        }
      }
    }
  }
  ```

---

## 4. Asset & JavaScript Optimization

### A. Image Optimization
- Use `<picture>` tags or modern framework image components (`next/image` in Next.js, `nuxt/image` in Nuxt):
  ```html
  <picture>
    <source type="image/avif" srcset="/img/banner.avif">
    <source type="image/webp" srcset="/img/banner.webp">
    <img src="/img/banner.jpg" alt="Banner" loading="lazy" decoding="async" width="800" height="400">
  </picture>
  ```
- For above-the-fold images: set `loading="eager"` and `fetchpriority="high"`.
- For below-the-fold images: set `loading="lazy"` and `decoding="async"`.

### B. Tree-Shaking & Dead Code Elimination
- Import ES module variants:
  - Good: `import debounce from 'lodash-es/debounce'`
  - Bad: `import { debounce } from 'lodash'` (bundles entire lodash library).
  - Good: `import { format } from 'date-fns'` (tree-shakeable) instead of monolithic moment.js.
- Ensure `"sideEffects": false` in `package.json` for custom internal packages.

### C. Script Loading Attributes
- `async`: Download in parallel, execute immediately when downloaded (order not guaranteed, best for standalone analytics).
- `defer`: Download in parallel, execute in document order after HTML parsing finishes (best for application scripts).
- `type="module"`: Defers automatically by default.

---

## 5. CSS Optimization & Web Fonts

### A. CSS Delivery
- Avoid `@import` in CSS files (creates sequential network request waterfalls).
- Purge unused CSS in production using Tailwind CSS JIT or PurgeCSS.
- Inline critical above-the-fold CSS into `<style>` in `<head>` for instant rendering; defer non-critical CSS.

### B. Web Font Optimization
- Self-host fonts instead of external Google Fonts requests to eliminate third-party DNS and TLS handshakes.
- Use modern `.woff2` format exclusively.
- Use `font-display: swap` to prevent FOIT (invisible text).
- Preload the 1 or 2 most critical font files:
  ```html
  <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  ```

---

## 6. React & Client-Side Framework Optimization

### A. Preventing Unnecessary Renders
- **`React.memo`**: Wrap pure display components that receive scalar or memoized props.
- **`useMemo` & `useCallback`**:
  - Use `useMemo` for computationally expensive transforms (sorting large arrays, complex calculations).
  - Use `useCallback` when passing callbacks to memoized children or dependencies in `useEffect`.
- **State Colocation**: Push state as low down the component tree as possible so updates don't re-render parent containers.

### B. DOM Virtualization
For lists containing more than 100 items, render only the visible viewport items using `@tanstack/react-virtual` or `react-window`:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualRow.start}px)`,
              height: `${virtualRow.size}px`,
              width: '100%',
            }}
          >
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Caching Strategy & HTTP Headers

- **Hashed Assets (`/assets/[name].[hash].js`)**:
  `Cache-Control: public, max-age=31536000, immutable`
- **Dynamic HTML (`index.html`)**:
  `Cache-Control: no-cache, no-store, must-revalidate` (ensures users always fetch latest script hashes).
- **Service Workers**: Cache shell assets with Cache-First or Stale-While-Revalidate strategies for instant repeat visits.

---

## 8. Lighthouse Audit Step-by-Step Workflow

1. **Run in Clean Environment**:
   - Run in Incognito/Private mode to avoid browser extension interference.
   - Or run headless via CLI:
     ```bash
     npx lighthouse-ci collect --url="https://example.com"
     ```
2. **Read the Opportunities & Diagnostics**:
   - Check *Eliminate render-blocking resources*.
   - Check *Properly size images* and *Serve images in next-gen formats*.
   - Check *Reduce unused JavaScript* and *Reduce unused CSS*.
   - Check *Total Blocking Time (TBT)* — direct lab proxy for field INP.
3. **Implement, Retest, and Compare**:
   Compare mobile (simulated 4G throttling, mid-tier CPU) vs desktop reports to verify real-world user experience gains.
