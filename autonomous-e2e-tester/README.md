# Autonomous E2E & Visual Browser Tester 🎭
### إضافة Antigravity لاختبارات المتصفح المؤتمتة والفحص البصري للمستخدم

إضافة متخصصة تمكّن **Antigravity** من تصميم، كتابة، وتشغيل اختبارات شاملة لتجربة المستخدم (End-to-End User Journeys) والفحص البصري التراجعي (Visual Regression Testing) باستخدام **Playwright** و **Puppeteer**.

---

## 🌟 القدرات الأساسية (Core Capabilities)

1. **أتمتة رحلات المستخدم (User Journey Automation)**:
   - كتابة سيناريوهات تسجيل الدخول، إنشاء الحساب، الشراء، وملء النماذج المعقدة.
   - استخدام استراتيجية محددات العناصر المتينة والمبنية على إمكانية الوصول (`getByRole`, `getByLabel`, `getByTestId`).
2. **الفحص البصري التراجعي (Visual Regression & Snapshot Testing)**:
   - التقاط صور الشاشة ومقارنة البكسلات مع الصور المرجعية لكشف أي انزياح أو كسر في الواجهة.
   - اختبار الواجهة عبر أجهزة متعددة (Desktop Chrome, Mobile Safari, Tablet).
   - حجب العناصر الديناميكية المتغيرة (التواريخ، المعرفات العشوائية) لمنع الإنذارات الكاذبة.
3. **التشغيل الخفي التلقائي (Headless Execution & Error Snapping)**:
   - تشغيل المتصفح في الخلفية والتقاط صور شاشة فورية عند حدوث أي خطأ لسرعة التشخيص.

---

## 📂 بنية الإضافة (Directory Structure)

```text
autonomous-e2e-tester/
├── plugin.json
├── README.md
├── rules/
│   └── AGENTS.md                                     # معايير كتابة اختبارات E2E المتينة
├── skills/
│   ├── playwright-journey-orchestrator/              # مهارة تخطيط وتوليد اختبارات Playwright
│   │   └── SKILL.md
│   └── visual-regression-auditor/                    # مهارة الفحص البصري ومطابقة الـ Snapshots
│       └── SKILL.md
├── scripts/
│   └── runner-template.mjs                           # مشغل Playwright خفي جاهز
└── references/
    ├── playwright-locator-best-practices.md          # أفضل ممارسات محددات العناصر
    └── e2e-ci-github-actions.md                      # مسار عمل CI/CD في GitHub Actions
```
