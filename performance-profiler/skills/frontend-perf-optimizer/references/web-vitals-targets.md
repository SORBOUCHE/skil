# Web Vitals & Frontend Performance Targets Reference

A definitive quick-reference guide for performance budgets, Core Web Vitals thresholds, Lighthouse scoring breakdowns, and HTTP caching headers.

---

## 1. Core Web Vitals Thresholds (75th Percentile)

| Metric | Target (Good) | Needs Improvement | Poor | Primary Focus Area |
| :--- | :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | **≤ 2.5 s** | 2.5 s – 4.0 s | **> 4.0 s** | Loading performance (Hero images, render-blocking JS/CSS) |
| **INP** (Interaction to Next Paint) | **≤ 200 ms** | 200 ms – 500 ms | **> 500 ms** | Interactivity & responsiveness (Main thread tasks, JS execution) |
| **CLS** (Cumulative Layout Shift) | **≤ 0.1** | 0.1 – 0.25 | **> 0.25** | Visual stability (Reserved dimensions, font swapping) |
| **FCP** (First Contentful Paint) | **≤ 1.8 s** | 1.8 s – 3.0 s | **> 3.0 s** | Initial render response |
| **TTFB** (Time to First Byte) | **≤ 800 ms** | 800 ms – 1800 ms | **> 1800 ms** | Server processing, edge routing, CDN cache hit rate |

---

## 2. Performance Budget Recommendations (Mobile / 4G Baseline)

Recommended maximum compressed (gzip / Brotli) transfer sizes for optimal mobile performance:

| Resource Type | Recommended Budget (Compressed) | Recommended Budget (Uncompressed) | Rationale |
| :--- | :--- | :--- | :--- |
| **Initial JavaScript** | **≤ 170 KB** | ≤ 600 KB | Avoids > 2s parsing/compilation delay on budget devices |
| **Total JavaScript** (per route) | **≤ 350 KB** | ≤ 1.2 MB | Keeps INP < 200ms and avoids main-thread blockage |
| **CSS (Critical + Non-critical)** | **≤ 50 KB** | ≤ 250 KB | Prevents render-blocking stylesheet stalls |
| **Above-the-Fold Images** | **≤ 100 KB** (each) | - | Essential for meeting LCP < 2.5s |
| **Web Fonts (Total)** | **≤ 100 KB** (max 2 files) | - | Using WOFF2 format with subsetting |
| **Total Page Transfer** | **≤ 1.5 MB** | - | Respects data limits and slow 4G network constraints |

---

## 3. Lighthouse Performance Score Breakdown (v10 / v11)

Lighthouse calculates the Performance score (0–100) using a weighted average of individual lab audit metrics:

| Metric | Metric Weight in Score | Description |
| :--- | :--- | :--- |
| **Total Blocking Time (TBT)** | **30%** | Lab proxy for INP. Measures time when CPU was blocked by tasks > 50ms |
| **Largest Contentful Paint (LCP)** | **25%** | Lab measure of when primary visual element finishes rendering |
| **Cumulative Layout Shift (CLS)** | **25%** | Lab measure of unexpected layout shifts |
| **First Contentful Paint (FCP)** | **10%** | Time until first text or canvas element renders |
| **Speed Index (SI)** | **10%** | How quickly contents of a page are visually populated |

> **Audit Tier Ratings**:
> - **90 – 100 (Green)**: Fast (Passing standard)
> - **50 – 89 (Orange)**: Average (Needs Improvement)
> - **0 – 49 (Red)**: Slow (Poor user experience)

---

## 4. HTTP Cache-Control Directives Reference

| Directive | Purpose | Ideal Use Case |
| :--- | :--- | :--- |
| `public, max-age=31536000, immutable` | Caches asset in browser and CDN for 1 full year; will never re-request | Hashed production bundles (`app.a1b2c3.js`, `styles.9x8y.css`, hashed images) |
| `no-cache` | Browser caches response, but MUST validate with server (`ETag`/`Last-Modified`) before using | Dynamic HTML files (`index.html`) so releases are served immediately |
| `no-store` | Complete refusal to store any copy in browser or intermediate caches | Sensitive authenticated endpoints, personal data, payment info |
| `stale-while-revalidate=60` | Serves stale cached content immediately while fetching fresh data in the background | Read-heavy semi-static APIs (product catalog, articles) |
| `s-maxage=3600` | Overrides `max-age` specifically for shared caches / CDNs | CDN edge caching distinct from end-user browser caching |
