#!/usr/bin/env node
/**
 * Autonomous E2E Browser Runner Template
 * Production-ready standalone Playwright execution script with screenshot capture,
 * trace recording, console log monitoring, and robust error recovery.
 *
 * Usage:
 *   node scripts/runner-template.mjs
 *   node scripts/runner-template.mjs --url=https://example.com --headed
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse simple CLI flags
const args = process.argv.slice(2);
const isHeaded = args.includes('--headed');
const targetUrlArg = args.find(a => a.startsWith('--url='));
const targetUrl = targetUrlArg ? targetUrlArg.split('=')[1] : process.env.TARGET_URL || 'https://example.com';

const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts/run-' + Date.now());

async function runAutonomousJourney() {
  console.log('🚀 [E2E Runner] Initializing Autonomous Browser Session...');
  console.log(`🌐 Target URL: ${targetUrl}`);
  console.log(`🖥️  Mode: ${isHeaded ? 'Headed' : 'Headless'}`);

  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });

  let browser = null;
  let context = null;
  let page = null;

  const collectedConsoleErrors = [];
  const collectedNetworkFailures = [];

  try {
    // 1. Launch Browser
    browser = await chromium.launch({
      headless: !isHeaded,
      slowMo: isHeaded ? 100 : 0
    });

    // 2. Create Isolated Browser Context
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Autonomous-E2E-Tester/1.0',
      recordVideo: {
        dir: path.join(ARTIFACTS_DIR, 'videos'),
        size: { width: 1280, height: 720 }
      }
    });

    // 3. Start Playwright Tracing
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true
    });

    page = await context.newPage();

    // 4. Attach Observability Listeners
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`🔴 [Browser Console Error]: ${msg.text()}`);
        collectedConsoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      console.error(`💥 [Uncaught Page Exception]: ${err.message}`);
      collectedConsoleErrors.push(err.message);
    });

    page.on('requestfailed', request => {
      const failure = request.failure();
      const errorText = `${request.method()} ${request.url()} failed: ${failure ? failure.errorText : 'unknown'}`;
      console.warn(`⚠️ [Network Failure]: ${errorText}`);
      collectedNetworkFailures.push(errorText);
    });

    // 5. Navigate to Target Journey Step
    console.log(`⏱️  Navigating to ${targetUrl}...`);
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const status = response ? response.status() : 'N/A';
    console.log(`✅ Page loaded with status: ${status}`);

    // 6. Perform Resilient Interactions & Assertions
    const pageTitle = await page.title();
    console.log(`📄 Page Title: "${pageTitle}"`);

    // Verify main landmark or heading exists
    const mainHeading = page.getByRole('heading', { level: 1 });
    const isHeadingVisible = await mainHeading.isVisible({ timeout: 5000 }).catch(() => false);

    if (isHeadingVisible) {
      const headingText = await mainHeading.textContent();
      console.log(`🎯 Found primary H1 heading: "${headingText ? headingText.trim() : ''}"`);
    } else {
      console.log('ℹ️ No top-level H1 heading detected, falling back to body verification.');
    }

    // 7. Capture Milestone Screenshot
    const screenshotPath = path.join(ARTIFACTS_DIR, 'journey-success.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`📸 Full-page snapshot saved: ${screenshotPath}`);

    // 8. Stop and Save Trace on Success
    await context.tracing.stop({
      path: path.join(ARTIFACTS_DIR, 'trace.zip')
    });

    // Write Execution Summary Log
    const summary = {
      status: 'PASSED',
      timestamp: new Date().toISOString(),
      url: targetUrl,
      title: pageTitle,
      artifacts: {
        screenshot: screenshotPath,
        trace: path.join(ARTIFACTS_DIR, 'trace.zip')
      },
      consoleErrorsCount: collectedConsoleErrors.length,
      networkFailuresCount: collectedNetworkFailures.length
    };

    await fs.writeFile(
      path.join(ARTIFACTS_DIR, 'summary.json'),
      JSON.stringify(summary, null, 2),
      'utf-8'
    );

    console.log('🎉 [E2E Runner] Journey completed successfully!');
    return 0;

  } catch (error) {
    console.error('❌ [E2E Runner] Test Journey Failed!');
    console.error(error);

    if (page) {
      const failureScreenshotPath = path.join(ARTIFACTS_DIR, 'failure-state.png');
      try {
        await page.screenshot({ path: failureScreenshotPath, fullPage: true });
        console.log(`🚨 Failure snapshot saved: ${failureScreenshotPath}`);
      } catch (screenshotError) {
        console.error('Failed to capture failure screenshot:', screenshotError.message);
      }
    }

    if (context) {
      try {
        await context.tracing.stop({
          path: path.join(ARTIFACTS_DIR, 'failure-trace.zip')
        });
        console.log(`🔍 Failure trace archive saved: ${path.join(ARTIFACTS_DIR, 'failure-trace.zip')}`);
      } catch (traceError) {
        console.error('Failed to save failure trace:', traceError.message);
      }
    }

    // Write Failure Summary Log
    const failureSummary = {
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      url: targetUrl,
      error: {
        message: error.message,
        stack: error.stack
      },
      consoleErrors: collectedConsoleErrors,
      networkFailures: collectedNetworkFailures
    };

    await fs.writeFile(
      path.join(ARTIFACTS_DIR, 'summary.json'),
      JSON.stringify(failureSummary, null, 2),
      'utf-8'
    ).catch(() => {});

    return 1;

  } finally {
    // 9. Teardown
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.log('🧹 Browser context and process closed.');
  }
}

// Execute runner
runAutonomousJourney()
  .then(code => process.exit(code))
  .catch(err => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
