# Security Sentinel & Vulnerability Guard 🛡️
> Proactive security auditor and secret leak prevention plugin for Antigravity.
> إضافة الحارس الأمني للتدقيق الاستباقي ومنع تسريب الأسرار والرموز البرمجية الحساسة.

---

## English Overview

**Security Sentinel** is an enterprise-grade security plugin designed for Google Gemini and Antigravity agents. It acts as an autonomous guardian that blocks accidental credential commits, audits codebases against the OWASP Top 10 web vulnerabilities, screens third-party dependencies for known CVEs, and enforces Zero-Trust coding directives.

### Key Capabilities

1. **Active Secret Interceptor (`hooks/secret-scanner.js`)**:
   - Intercepts calls to `write_to_file` in real time before code is saved to disk.
   - Blocks exposed AWS keys, GitHub PATs, OpenAI/Anthropic/Gemini keys, database connection strings, and RSA/SSH private keys.
   - Prompts developers with clear warnings when a hardcoded credential is detected.

2. **OWASP Top 10 Vulnerability Auditor (`skills/vulnerability-auditor`)**:
   - Comprehensive audit guide for Broken Access Control (IDOR), SQL/Command Injection, Cryptographic Failures, SSRF, XSS, and Insecure Design.
   - Provides concrete, language-specific remediation patterns (Node.js/TypeScript, Python, SQL).

3. **CVE & Supply Chain Dependency Scanner (`skills/cve-dependency-scanner`)**:
   - Multi-ecosystem tooling instructions (`npm audit`, `pip-audit`, `cargo audit`, `govulncheck`).
   - Detection of lockfile tampering, typosquatting packages, and dependency confusion attacks.

4. **Security Directives (`rules/AGENTS.md`)**:
   - Mandatory standards for secure coding: zero hardcoded credentials, parameterized queries, Argon2id/bcrypt password hashing, and server-side validation.

---

## Directory Structure

```text
security-sentinel/
├── plugin.json                              # Plugin manifest & suggested prompts
├── hooks.json                               # PreToolUse hook configuration
├── README.md                                # Bilingual documentation
├── hooks/
│   └── secret-scanner.js                    # Node.js secret scanning script
├── rules/
│   └── AGENTS.md                            # Non-negotiable security mandates
├── skills/
│   ├── vulnerability-auditor/
│   │   └── SKILL.md                         # OWASP Top 10 assessment skill
│   └── cve-dependency-scanner/
│       └── SKILL.md                         # Dependency & supply chain scanner skill
└── references/
    ├── owasp-top-10-remediation.md          # Remediation guide with code snippets
    └── secret-detection-patterns.md         # Regex catalog & entropy analysis
```

---

## Quick Start & Usage Prompts

To invoke Security Sentinel capabilities, use prompts such as:
- *"Audit my codebase for hardcoded secrets, API keys, and sensitive tokens"*
- *"Perform an OWASP Top 10 vulnerability scan across my API routes and data queries"*
- *"Audit my package dependencies for known CVE vulnerabilities and recommend safe updates"*

---

## Hook Lifecycle & Behavior

When an agent attempts to execute `write_to_file`:
1. The `PreToolUse` hook runs `node hooks/secret-scanner.js`.
2. Stdin receives the tool arguments including `CodeContent`.
3. If an API key or private key pattern is matched:
   - Output: `{"decision":"ask","reason":"[SECURITY ALERT] Potential hardcoded credential..."}`
   - The user is notified to confirm or move the secret to an environment variable.
4. If clean:
   - Output: `{"decision":"allow"}` and the write operation proceeds seamlessly.

---

<br/>

## نظرة عامة باللغة العربية (Arabic Overview)

**الحارس الأمني (Security Sentinel)** هو إضافة أمنية متكاملة لبيئة وكلاء Gemini و Antigravity. تعمل الإضافة كخط دفاع أوتوماتيكي استباقي يمنع حفظ الرموز السرية ومفاتيح API في الملفات البرمجية، ويفحص الكود وفقاً لمعايير OWASP Top 10، ويدقق حزم ومكتبات المشروع بحثاً عن الثغرات الأمنية المعروفة (CVEs).

### أبرز الميزات:

1. **معترض الأسرار في الوقت الفعلي (`PreToolUse Hook`)**:
   - يفحص محتوى الكود قبل كتابته بواسطة أداة `write_to_file`.
   - يكتشف مفاتيح AWS، وتوكنز GitHub، ومفاتيح الذكاء الاصطناعي (Gemini, OpenAI, Anthropic)، وروابط قواعد البيانات المشتملة على كلمات مرور، والمفاتيح الخاصة (Private Keys).
   - يوقف العملية ويطلب تأكيد المطور عند اكتشاف بيانات سرية لمنع تسريبها.

2. **مدقق ثغرات OWASP Top 10 (`skills/vulnerability-auditor`)**:
   - دليل منهجي شامل لفحص ثغرات التحكم في الوصول (IDOR)، والحقن (SQL Injection)، وفشل التشفير، والـ SSRF، و Cross-Site Scripting.
   - يتضمن أمثلة عملية بلغات متعددة (Node.js/TypeScript و Python) لإصلاح الثغرات بشكل سليم.

3. **فاحص سلاسل التوريد والتبعيات (`skills/cve-dependency-scanner`)**:
   - يدعم تدقيق التبعيات عبر `npm audit`, `pip-audit`, `cargo audit`, `govulncheck`.
   - كشف هجمات التسميم في ملفات القفل (Lockfile poisoning) وهجمات التشابه اللفظي للحزم (Typosquatting).

4. **قواعد وتوجيهات أمنية صارمة (`rules/AGENTS.md`)**:
   - منع تضمين الأسرار في الكود والاعتماد الكلي على متغيرات البيئة.
   - إلزام استخدام الاستعلامات المجهزة والمعلمة (Parameterized Queries).
   - استخدام خوارزميات التشفير والهاشينغ الحديثة (Argon2id و bcrypt) ومنع MD5 و SHA1 لكلمات المرور.

---

## الترخيص والاعتماد (License & Governance)

هذه الإضافة مبنية لدعم بيئة عمل آمنة وفق مبدأ انعدام الثقة (Zero-Trust Security Architecture).
Licensed under Apache-2.0.
