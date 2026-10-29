#!/usr/bin/env node
/**
 * Arabic RTL CLI Utility
 * Direct CLI tool to inspect and correct Arabic RTL formatting, BiDi inversion,
 * and punctuation jumping in files and directories.
 */

const fs = require('fs');
const path = require('path');
const { correctArabicText, hasArabic, wrapInRtlContainer } = require('./rtl-core.js');

function processFile(filePath, fixInPlace = false, wrapContainer = false) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (!hasArabic(content)) {
    console.log(`ℹ️ [SKIP] No Arabic text detected in: ${path.basename(filePath)}`);
    return;
  }

  const corrected = correctArabicText(content, {
    isolateLatin: true,
    wrapContainer: wrapContainer && (filePath.endsWith('.md') || filePath.endsWith('.html'))
  });

  if (fixInPlace) {
    fs.writeFileSync(filePath, corrected, 'utf8');
    console.log(`✅ [FIXED] Corrected Arabic RTL & BiDi formatting in: ${filePath}`);
  } else {
    console.log(`\n--- [PREVIEW: ${path.basename(filePath)}] ---\n`);
    console.log(corrected);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
استخدام أداة تصحيح الخط العربي (Arabic RTL CLI Tool):
  node rtl-cli.js <مسار_الملف> [--fix] [--wrap]

الخيارات:
  --fix    تطبيق التعديلات وحفظها مباشرة في نفس الملف.
  --wrap   تغليف الملف بحاوية HTML تدعم الـ RTL للملفات النصية وMarkdown.
  بدون خيارات: معاينة النص المصحح في الطرفية دون تعديل الملف الأصلي.
`);
    return;
  }

  const targetPath = args[0];
  const fixInPlace = args.includes('--fix');
  const wrapContainer = args.includes('--wrap');

  const resolved = path.resolve(targetPath);
  const stat = fs.statSync(resolved);

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(resolved);
    for (const entry of entries) {
      if (entry.endsWith('.md') || entry.endsWith('.txt') || entry.endsWith('.html')) {
        processFile(path.join(resolved, entry), fixInPlace, wrapContainer);
      }
    }
  } else {
    processFile(resolved, fixInPlace, wrapContainer);
  }
}

main();
