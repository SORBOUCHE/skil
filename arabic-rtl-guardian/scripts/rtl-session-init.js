#!/usr/bin/env node
/**
 * Arabic RTL Guardian: SessionStart Hook
 * Automatically initializes Arabic typography, BiDi isolation, and RTL directives,
 * and directly injects real-time RTL styles into the Antigravity Chromium UI.
 */

const readline = require('node:readline');
const { runInjection } = require('./rtl-ui-injector.js');

async function main() {
  let inputData = '';
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    inputData += line;
  }

  // Trigger UI injection asynchronously in background
  try {
    runInjection().catch(() => {});
  } catch (_) {}

  const directive = `[ARABIC RTL ACTIVATED]
حارس اتجاه الخط العربي والطباعة ثنائية الاتجاه (Arabic RTL & BiDi Guardian) مفعل تلقائياً لهذه الجلسة:
1. إجبار محاذاة النص لليمين: يجب تغليف كافة الردود والفقرات باللغة العربية داخل حاوية RTL صريحة:
   <div dir="rtl" style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; unicode-bidi: isolate;">
   (النص العربي هنا)
   </div>
2. عزل المصطلحات اللاتينية والإنجليزية وأسماء المتغيرات والأوامر داخل علامات \`backticks\` دائماً لمنع تشوه الجمل.
3. تثبيت علامات الترقيم في جهة اليمين عبر Unicode RLM (\\u200F).`;

  const payload = {
    injectSteps: [
      {
        systemMessage: {
          systemMessage: directive
        }
      }
    ]
  };

  process.stdout.write(JSON.stringify(payload));
}

main().catch(() => {
  process.stdout.write(JSON.stringify({ injectSteps: [] }));
});
