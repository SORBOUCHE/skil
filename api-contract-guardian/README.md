# 🛡️ API Contract Guardian & Mock Server

**API Contract Guardian** is an enterprise-grade Antigravity plugin engineered to preserve strict API contract integrity between client applications and backend microservices. It orchestrates OpenAPI 3.1 specification workflows, detects silent type drift between frontend TypeScript DTOs and backend payloads, and provides an instant zero-dependency mock API server.

---

## 🌟 Key Capabilities / المميزات الرئيسية

- 📜 **OpenAPI 3.1 Contract Synchronization**: Automated specification generation from backend models (Zod, Pydantic, NestJS, FastAPI), automated TypeScript generation via `openapi-typescript`, and type-safe client consumption via `openapi-fetch`.
- 🔍 **Type Drift Detection & Auditing**: Identifies silent desynchronizations—missing optional/nullable flags, casing mismatches (`camelCase` vs `snake_case`), date serialization errors, and numeric precision loss.
- 🚀 **Zero-Dependency Mock Server**: High-performance Node.js HTTP mock server with route parameter matching, configurable network latency/jitter, chaos error injection, and stateful in-memory CRUD operations.
- 🚫 **Zero Breaking Changes Policy**: Automated contract diffing via `oasdiff` in CI pipelines to prevent backwards-incompatible schema modifications without versioning.
- 📐 **RFC 7807 Error Standardization**: Enforces structured problem details across all $4xx$ and $5xx$ responses.

---

## 📁 Directory Structure / هيكلية المجلدات

```
api-contract-guardian/
├── plugin.json                                # Plugin manifest and suggested prompts
├── README.md                                  # Comprehensive bilingual documentation
├── rules/
│   └── AGENTS.md                              # Strict contract integrity governance rules
├── skills/
│   ├── openapi-contract-sync/
│   │   └── SKILL.md                          # OpenAPI 3.1 sync & TypeScript codegen guide
│   ├── type-drift-detector/
│   │   └── SKILL.md                          # Type drift audit methodology & interceptors
│   └── mock-api-server/
│       └── SKILL.md                          # Zero-dependency mock engine guide
├── scripts/
│   └── mock-server.mjs                        # Standalone runnable Node.js mock server
└── references/
    ├── openapi-specification-cheatsheet.md    # High-density OpenAPI 3.1 reference
    └── type-drift-audit-checklist.md          # 5-phase type drift verification checklist
```

---

## 🛠️ Included Skills / المهارات المضمنة

### 1. `openapi-contract-sync`
Provides exhaustive operational instructions for:
- Writing and structuring OpenAPI 3.1 documents with JSON Schema 2020-12 parity.
- Generating specs from backend models using `@asteasolutions/zod-to-openapi` or FastAPI.
- Compiling TypeScript interfaces with `openapi-typescript` and using `openapi-fetch`.
- Linting API contracts with Spectral (`@stoplight/spectral-cli`).
- Guarding pull requests against breaking changes with `oasdiff`.

### 2. `type-drift-detector`
Provides deep auditing techniques to catch runtime discrepancies:
- Identifying the 6 main archetypes of type drift (Nullability, Casing, Dates, BigInt/Numbers, Enums, Envelopes).
- Real-time dev-mode validation interceptors using Zod guards.
- Standalone payload inspection script comparing live API outputs against contract schemas.
- Systematic 4-step remediation protocol.

### 3. `mock-api-server`
Provides an instant local HTTP mock engine with zero external npm dependencies:
- Pure Node.js built-ins (`node:http`, `node:fs`, `node:url`).
- Realistic artificial network latency ($50\text{ms} - 250\text{ms}$) with jitter.
- Chaos error injection rate (e.g. 5% random 500s).
- Full CORS handling with preflight `OPTIONS` support.
- Standalone runnable script at `scripts/mock-server.mjs`.

---

## 🚀 Quick Start / البدء السريع

### 1. Launch the Mock Server
Start an instant mock API server locally:
```bash
node scripts/mock-server.mjs --port 4000 --spec ./contracts/openapi.json --min-delay 100 --max-delay 300
```

### 2. Generate Frontend TypeScript Types
Synchronize your frontend interfaces directly from the OpenAPI contract:
```bash
npx openapi-typescript ./contracts/openapi.json -o ./src/lib/api/schema.d.ts
```

### 3. Lint the Specification
Ensure naming conventions, descriptions, and RFC 7807 problem details are met:
```bash
npx @stoplight/spectral-cli lint ./contracts/openapi.json
```

---

## 📋 Governance Rules Summary (`rules/AGENTS.md`)

1. **Schema-First or Strictly Synchronized**: Every endpoint must be backed by an authoritative schema (Zod, Pydantic, OpenAPI). Raw untyped payloads (`any`, `dict[str, Any]`) are prohibited.
2. **Zero Breaking Changes**: Modifying field types or removing active fields requires API versioning (`/v1/` $\to$ `/v2/`).
3. **Strict Nullability Alignment**: Distinguish clearly between `null` and `undefined`. Never type a database nullable column as non-nullable in frontend interfaces.
4. **Normalized Date & Decimal Serialization**: Use ISO-8601 UTC strings for dates and string/cents representation for high-precision currencies or 64-bit integers.

---

# 🌐 دليل الاستخدام باللغة العربية (Arabic Documentation)

## نظرة عامة
إضافة **API Contract Guardian** هي أداة متقدمة لبيئة Antigravity مصممة لضمان التوافق الصارم والتام بين واجهات برمجة التطبيقات (APIs) في الواجهة الخلفية (Backend) وتطبيقات الواجهة الأمامية (Frontend). تحمي الإضافة المشاريع من الأخطاء الصامتة الناتجة عن تباين الأنواع (Type Drift)، وتوفر خادم محاكاة فوري بدون أي مكتبات خارجية (Zero-Dependency Mock Server).

## أبرز الميزات:
1. **المزامنة الشاملة مع OpenAPI 3.1**: توليد وتحديث وثائق ومواصفات OpenAPI ومزامنتها لحظياً مع واجهات TypeScript في الفرونت إند عبر `openapi-typescript`.
2. **كاشف انحراف الأنواع (Type Drift Detector)**: تشخيص ومعالجة الفروقات الخفية مثل الحقول التي تصبح `null` فجأة، أو تضارب تسمية الحقول (`camelCase` مقابل `snake_case`)، أو تنسيقات التواريخ.
3. **خادم محاكاة API فوري وخفيف**: خادم مبني على Node.js القياسي يعمل فوراً دون الحاجة لتثبيت حزم خارجية، مع محاكاة تأخير الشبكة الطبيعي وحقن الأخطاء لاختبار متانة التطبيق.
4. **سياسة منع التعديلات الكاسرة (Zero Breaking Changes)**: فرض إصدارات واضحة (`/v1/` مقابل `/v2/`) لمنع توقف التطبيقات النشطة لدى المستخدمين.

## تشغيل خادم المحاكاة الفوري:
```bash
node scripts/mock-server.mjs --port 4000 --spec ./contracts/openapi.json
```
خيارات إضافية:
- `--min-delay 100`: تحديد الحد الأدنى لتأخير الاستجابة (بالملي ثانية).
- `--max-delay 400`: تحديد الحد الأقصى لتأخير الاستجابة.
- `--error-rate 0.05`: محاكاة نسبة 5% من أخطاء السيرفر (500) لاختبار استجابة الواجهة للأخطاء.

---

## 📄 License & Integrity
Crafted for Antigravity AI environments. Fully adheres to strict API design standards and modern TypeScript / OpenAPI 3.1 specifications.
