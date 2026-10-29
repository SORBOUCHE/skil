#!/usr/bin/env node
/**
 * performance-profiler: PostToolUse Hook - Bundle Size Gate
 * Warns when build output JS exceeds performance budget.
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const JS_BUDGET_BYTES = 1024 * 1024; // 1MB
const BUILD_OUTPUT_DIRS = ['dist', '.next', 'build', 'out', 'www'];

function getFileSizeRecursive(dir, ext) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += getFileSizeRecursive(fullPath, ext);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        try { total += fs.statSync(fullPath).size; } catch (_) {}
      }
    }
  } catch (_) {}
  return total;
}

async function main() {
  let inputData = '';
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) { inputData += line; }

  let payload = {};
  try { payload = JSON.parse(inputData); } catch (_) {}

  const cmdLine = (payload.toolCall?.args?.CommandLine || '').toLowerCase();
  const isBuildCmd = ['build', 'bundle', 'webpack', 'vite build', 'next build', 'flutter build'].some(k => cmdLine.includes(k));

  if (!isBuildCmd) {
    process.stdout.write('{}');
    return;
  }

  const workspacePaths = payload.workspacePaths || [];
  let totalJsBytes = 0;
  let foundDir = null;

  for (const wsPath of workspacePaths) {
    for (const outDir of BUILD_OUTPUT_DIRS) {
      const full = path.join(wsPath, outDir);
      if (fs.existsSync(full)) {
        const size = getFileSizeRecursive(full, '.js');
        if (size > 0) {
          totalJsBytes += size;
          foundDir = full;
        }
      }
    }
  }

  if (foundDir && totalJsBytes > JS_BUDGET_BYTES) {
    const kb = (totalJsBytes / 1024).toFixed(1);
    const msg = `[PERF GATE] ⚠️ Bundle size warning: ${kb}KB of JavaScript detected in ${foundDir}. Budget is 1MB (1024KB). Consider code-splitting, tree-shaking, or lazy loading to reduce bundle size and improve LCP/TTI scores.`;
    process.stderr.write(msg + '\n');
  }

  process.stdout.write('{}');
}

main().catch(() => process.stdout.write('{}'));
