#!/usr/bin/env node
/**
 * Arabic RTL Guardian: PostToolUse Hook
 * Sanitizes written Markdown and HTML artifact files that contain Arabic text,
 * ensuring proper RTL containers and punctuation stabilization.
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { hasArabic, correctArabicText, wrapInRtlContainer } = require('./rtl-core.js');

async function main() {
  let inputData = '';
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    inputData += line;
  }

  let payload = {};
  try {
    payload = JSON.parse(inputData);
  } catch (_) {}

  const toolName = payload.toolCall?.name || '';
  const args = payload.toolCall?.args || {};
  const filePath = args.Path || args.TargetFile || '';

  if (filePath && (filePath.endsWith('.md') || filePath.endsWith('.html') || filePath.endsWith('.htm'))) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        if (hasArabic(raw)) {
          // If HTML artifact missing dir="rtl"
          if (filePath.endsWith('.html') && !raw.includes('dir="rtl"')) {
            const wrapped = raw.replace(/<body([^>]*)>/i, '<body$1 dir="rtl" style="direction: rtl; text-align: right;">');
            if (wrapped !== raw) {
              fs.writeFileSync(filePath, wrapped, 'utf8');
            }
          }
        }
      } catch (_) {}
    }
  }

  process.stdout.write('{}');
}

main().catch(() => {
  process.stdout.write('{}');
});
