#!/usr/bin/env node
/**
 * Arabic RTL Guardian: PreInvocation Hook
 * Inspects incoming user input. If Arabic text is detected, injects active BiDi
 * directives and re-verifies that Antigravity UI has the RTL observer injected.
 */

const readline = require('node:readline');
const { hasArabic } = require('./rtl-core.js');
const { runInjection } = require('./rtl-ui-injector.js');

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
    // Re-verify UI injection
    try {
      runInjection().catch(() => {});
    } catch (_) {}

    const reminder = '[ARABIC RTL ACTIVE] تم رصد مدخلات باللغة العربية. يجب تغليف الرد داخل <div dir="rtl" style="direction: rtl; text-align: right; unicode-bidi: isolate;">، وعزل الكلمات الإنجليزية بالـ `backticks`، وتثبيت علامات الترقيم باليمين عبر RLM (\\u200F).';
    process.stdout.write(JSON.stringify({
      injectSteps: [
        { ephemeralMessage: reminder }
      ]
    }));
    return;
  }

  process.stdout.write(JSON.stringify({ injectSteps: [] }));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ injectSteps: [] }));
});
