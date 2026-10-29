#!/usr/bin/env node
/**
 * Arabic RTL Guardian: PreInvocation Hook
 * Inspects incoming user input. If Arabic text is detected, injects active BiDi
 * and RTL formatting directives so the assistant's reply is flawlessly aligned.
 */

const readline = require('node:readline');
const { hasArabic } = require('./rtl-core.js');

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

  const lastUserInput = payload.lastUserInput || '';

  if (hasArabic(lastUserInput)) {
    const reminder = '[ARABIC RTL ACTIVE] تم رصد مدخلات باللغة العربية. احرص على: عزل المصطلحات الإنجليزية بالـ `backticks`، تثبيت علامات الترقيم باليمين عبر RLM (\\u200F)، واستخدام اتجاه RTL في أي ملفات Artifacts.';
    process.stdout.write(JSON.stringify({
      injectSteps: [
        { ephemeralMessage: reminder }
      ]
    }));
    return;
  }

  // If no Arabic detected, exit silently with zero overhead
  process.stdout.write(JSON.stringify({ injectSteps: [] }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ injectSteps: [] }));
});
