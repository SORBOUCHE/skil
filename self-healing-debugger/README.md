# Self-Healing Debugger & Error Engine
# محرك التصحيح التلقائي والتشخيص الذاتي للأخطاء

Autonomous diagnostic and self-healing engine plugin for Antigravity. Intercepts runtime errors, failed builds, and test crashes, extracts stack traces and error roots, and formulates automated verified surgical patches.

إضافة متقدمة لمنظومة Antigravity متخصصة في التشخيص الذاتي ومعالجة الأعطال البرمجية فور حدوثها، واستخراج مسارات تتبع الأخطاء (Stack Traces)، وعزل الأسباب الجذرية، وتطبيق رقع برمجية جراحية ومتحقق منها آلياً.

---

## 🌟 English Overview

The **Self-Healing Debugger** transforms error handling from reactive guesswork into an automated, scientific discipline. When terminal commands, build processes, or automated tests fail, the engine's hooks intercept the failure signature, parse the stack trace across modern language runtimes, identify the originating source line, and orchestrate a verified remediation loop.

### Key Capabilities
- **Autonomous Hook Interception (`hooks/error-healer.js`):** Intercepts `run_command` tool outputs, catches runtime exceptions (`SyntaxError`, `TypeError`, `panics`, `Tracebacks`), parses files and lines, and alerts the agent in real time.
- **Deep Root Cause Analysis (`skills/root-cause-analysis`):** Traces backward from symptoms to originating statements, avoiding the trap of patching symptoms while leaving underlying bugs intact.
- **Automated Patch Verification (`skills/automated-patch-verifier`):** Enforces a strict red-to-green verification workflow with zero test assertion weakening and guaranteed zero regressions.
- **Multi-Runtime Stack Trace Decoding (`references/stack-trace-cheatsheet.md`):** Comprehensive signature reference for Node.js/V8, Python CPython, Go, Rust, and Dart/Flutter.
- **Systematic Triage Playbook (`references/debugging-playbook.md`):** 5-level operational standard for bug isolation, reproduction, surgical fixing, and regression testing.

---

## 🌟 نظرة عامة بالعربية

تعمل إضافة **Self-Healing Debugger** على تحويل معالجة الأخطاء من محاولات عشوائية إلى نهج هندسي مؤتمت ودقيق. عند فشل أوامر الطرفية أو عمليات البناء أو الاختبارات الآلية، يقوم خطاف الإضافة (`PostToolUse Hook`) بالتقاط بصمة الخطأ، وتحليل مسار التتبع لمختلف لغات البرمجة، وعزل السطر المسبب بدقة، وقيادة دورة تصحيح جراحية ومثبتة.

### أبرز الميزات:
1. **اعتراض الأعطال فوريًا (`hooks/error-healer.js`):** يرصد مخرجات `run_command` ويكتشف استثناءات الانهيار (`TypeError`، `Panics`، `Traceback`) ويستخرج اسم الملف ورقم السطر مع توجيه إشعار تشخيصي فوري.
2. **تحليل السبب الجذري (`skills/root-cause-analysis`):** تتبع مسار البيانات من العَرَض الخارجي إلى الخلل الأصلي دون الاكتفاء بالترقيع السطحي.
3. **التحقق الآلي من الرقع البرمجية (`skills/automated-patch-verifier`):** بروتوكول هندسي صارم يضمن كتابة اختبار ارتداد، وتطبيق رقعة جراحية بأقل عدد أسطر، وإعادة تشغيل الاختبارات للتأكد من عدم كسر أي ميزة سابقة.
4. **دليل شامل لبصمات الأخطاء (`references/stack-trace-cheatsheet.md`):** تغطية لأنظمة التشغيل وأطر العمل لـ Node.js و Python و Go و Rust و Dart.
5. **دليل إجراءات التتبع (`references/debugging-playbook.md`):** خطة عمل واضحة من 5 مراحل بدءاً من استقبال الخطأ وحتى التقرير النهائي.

---

## 📁 Plugin Structure / هيكلية الإضافة

```text
self-healing-debugger/
├── plugin.json                              # Plugin definition and suggested prompts
├── hooks.json                               # PostToolUse hook configuration
├── hooks/
│   └── error-healer.js                      # Diagnostic hook script for error interception
├── rules/
│   └── AGENTS.md                            # Operational rules (zero silencing, preserve tests)
├── skills/
│   ├── root-cause-analysis/
│   │   └── SKILL.md                         # Deep trace & concurrency RCA protocol
│   └── automated-patch-verifier/
│       └── SKILL.md                         # Surgical patching & regression verification
├── references/
│   ├── stack-trace-cheatsheet.md            # Signatures for Node, Python, Go, Rust, Dart
│   └── debugging-playbook.md                # 5-level triage workflow guide
└── README.md                                # Bilingual documentation
```

---

## 🛡️ Agent Operational Rules / قواعد عمل الوكيل

1. **السبب الجذري أولاً (Root Cause First):** يمنع تطبيق تعديلات تخمينية دون تحديد وفهم السبب الفعلي للانهيار.
2. **حرمة الاختبارات (Preserve Test Integrity):** يمنع تعديل أو تخفيف شروط التحقق (`Assertions`) لإنجاح الاختبارات قسراً.
3. **تعديلات جراحية دقيقة (Surgical Edits):** حصر التعديل في أضيق نطاق منطقي ممكن لتقليل الاختلافات البرمجية (`Git Diff`).
4. **منع كتم الأخطاء (No Error Suppression):** حظر استخدام كتل `catch` أو `except` الفارغة التي تخفي الأخطاء وتفسد تدفق البيانات.

---

## 🚀 Suggested Prompts / نماذج الاستخدام المقترحة

- *"Diagnose this crash stack trace and formulate an automated patch to fix the root cause."*
- *"Run tests, analyze all failures, and propose surgical fixes without breaking existing features."*
- *"Audit my application for unhandled exception vectors and implement self-healing guardrails."*
- *"قم بتشخيص هذا الخطأ واستخرج السبب الجذري مع كتابة رقعة برمجية موثوقة باختبار ارتدادي."*

---

## 🔧 Installation & Verification / التثبيت والتحقق

This plugin is installed to:
`C:\Users\Admin\.gemini\config\plugins\self-healing-debugger\`

To verify hooks:
```powershell
node "C:\Users\Admin\.gemini\config\plugins\self-healing-debugger\hooks\error-healer.js"
```
Output: `{}` on stdout.
