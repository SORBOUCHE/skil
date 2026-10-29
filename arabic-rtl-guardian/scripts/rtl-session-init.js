#!/usr/bin/env node
/**
 * Arabic RTL Guardian: SessionStart Hook
 * Automatically initializes Arabic typography, BiDi isolation, and RTL directives
 * at the start of every Antigravity session.
 */

const readline = require('node:readline');

async function main() {
  let inputData = '';
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    inputData += line;
  }

  const directive = `[ARABIC RTL ACTIVATED]
حارس اتجاه الخط العربي والطباعة ثنائية الاتجاه (Arabic RTL & BiDi Guardian) مفعل تلقائياً لهذه الجلسة:
1. عند كتابة أي نص باللغة العربية، يجب عزل أي كلمات إنجليزية أو أسماء متغيرات أو مسارات ملفات أو أوامر داخل علامات التنصيص المائلة (Backticks مثل \`code\`).
2. علامات الترقيم في نهاية الجمل العربية (مثل . أو ! أو ؟ أو :) يجب أن تلتصق بالكلمة الأخيرة دون مسافة مسبقة، واستخدام علامة اتجاه اليمين لليسار Unicode RLM (\\u200F) عند الحاجة لتثبيتها في جهة اليمين ومنع قفزها لليسار.
3. عند إنشاء وثائق أو Artifacts تحتوي على نصوص عربية، يجب تغليف الحاوية بوسم:
   <div dir="rtl" style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; unicode-bidi: isolate;">...</div>
4. الأقواس التي تحيط بكلمات إنجليزية داخل نص عربي يجب أن تحاط بـ RLM لمنع انعكاسها.`;

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
