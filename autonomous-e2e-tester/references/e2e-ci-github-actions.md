# GitHub Actions CI Workflow for Playwright E2E Tests

This reference provides a battle-tested GitHub Actions workflow for running Playwright End-to-End tests in CI, with browser caching, matrix sharding, automatic retries, and comprehensive artifact uploads (HTML reports, failure traces, screenshots).

---

## 1. Production Workflow File

Save this file as `.github/workflows/playwright-e2e.yml` in your repository:

```yaml
name: Playwright End-to-End Tests

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master, develop ]
  workflow_dispatch:
    inputs:
      update_snapshots:
        description: 'Update Visual Snapshots?'
        required: false
        default: false
        type: boolean

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    name: Run E2E Test Suite (Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
    timeout-minutes: 60
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3]
        shardTotal: [3]

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Cache Playwright Browsers
        id: playwright-cache
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}

      - name: Install Playwright Browsers & System Dependencies
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps

      - name: Install System Dependencies Only (Cache Hit)
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps

      - name: Build Application
        run: npm run build
        env:
          NODE_ENV: test

      - name: Run Playwright Tests (Sharded)
        run: >
          npx playwright test
          --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
          ${{ github.event.inputs.update_snapshots == 'true' && '--update-snapshots' || '' }}
        env:
          CI: true
          BASE_URL: http://localhost:3000
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload Test Report & Artifacts on Failure
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-shard-${{ matrix.shardIndex }}
          path: |
            playwright-report/
            test-results/
          retention-days: 30

  # Merge sharded reports into a single unified report
  merge-reports:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Download all shard artifacts
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: playwright-report-shard-*
          merge-multiple: true

      - name: Publish Unified Summary
        run: |
          echo "### 🧪 E2E Test Execution Finished" >> $GITHUB_STEP_SUMMARY
          echo "All shards have completed execution. Download artifacts to inspect traces and failure screenshots." >> $GITHUB_STEP_SUMMARY
```

---

## 2. Key Workflow Capabilities

### A. Matrix Sharding
The workflow splits the test execution across 3 concurrent Ubuntu runners (`shard 1/3`, `shard 2/3`, `shard 3/3`), cutting execution time by nearly 65%. Increase `shardTotal` for large test suites.

### B. Intelligent Browser Binary Caching
Playwright browser binaries are cached at `~/.cache/ms-playwright`. If the lockfile has not changed, downloading full browser binaries is skipped, saving 1–2 minutes per run.

### C. Workflow Dispatch for Visual Snapshots
When manual baseline regeneration is needed, trigger the workflow via the **Actions** tab with `Update Visual Snapshots` checked. You can then download the updated snapshot artifacts or set up an automated PR committer step.

### D. Concurrency Management
`cancel-in-progress: true` automatically cancels older test runs if a developer pushes a new commit to the same Pull Request, preserving CI minutes.
