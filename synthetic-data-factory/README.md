# Synthetic Data & Stress Testing Factory 🏭⚡
# مصنع البيانات الاصطناعية واختبارات الضغط والتحميل

An advanced Antigravity plugin for synthesizing high-fidelity, privacy-compliant relational mock datasets and orchestrating enterprise-grade load and stress tests with **k6**, **autocannon**, and **Artillery**.

إضافة متطورة لتوليد مجموعات بيانات تجريبية واصطناعية علائقية فائقة الدقة ومتوافقة مع أعلى معايير الخصوصية، وإدارة وتشغيل اختبارات الضغط والتحميل العالي للتطبيقات وواجهات البرمجة (APIs).

---

## 🌟 Key Capabilities | الميزات الرئيسية

- **Relational Schema Parsing (استخراج وتحليل المخططات)**:
  - Supports SQL DDL (PostgreSQL, MySQL, SQLite), Prisma Schemas, TypeScript interfaces, and Python Pydantic models.
  - Automatically analyzes table dependencies, primary keys, foreign keys, and unique constraints.
- **Topological Integrity & Graph Resolution (الحفاظ الصارم على التكامل المرجعي)**:
  - Generates parent records first using Directed Acyclic Graphs (DAG), resolving 1:1, 1:N, and N:M junction relationships without broken foreign keys.
- **Zero Production PII (صفر بيانات حقيقية - خصوصية تامة)**:
  - Strict compliance with GDPR, HIPAA, and CCPA. All names, emails, phone numbers, payment cards, and addresses are synthetically generated.
- **Realistic Statistical Distributions (توزيعات إحصائية واقعية)**:
  - Pareto 80/20 distribution for activity skew, causal chronological timestamps, and domain-aware field synthesizers.
- **Load & Stress Test Orchestration (هندسة اختبارات الضغط والأداء)**:
  - Ready-to-use blueprints for k6 (REST, GraphQL, WebSockets), autocannon (Node.js micro-benchmarking), and Artillery.
  - Automated SLA thresholds (`p95 < 200ms`, `error_rate < 1%`) and saturation knee-point detection.

---

## 📁 Repository Structure | هيكل الإضافة

```
synthetic-data-factory/
├── plugin.json                              # Plugin definition and suggested prompts
├── README.md                                # Bilingual documentation (English & Arabic)
├── rules/
│   └── AGENTS.md                            # Core operational safety rules and PII policies
├── skills/
│   ├── schema-to-fixtures/
│   │   └── SKILL.md                         # Relational fixture generation guide (150+ lines)
│   └── stress-test-orchestrator/
│       └── SKILL.md                         # k6, autocannon & Artillery load testing guide (150+ lines)
└── references/
    ├── k6-testing-blueprints.md             # Production scripts for REST, GraphQL, and WebSockets
    └── mock-data-generators.md              # Algorithms for UUIDv7, dates, currencies, and names
```

---

## 🚀 Quick Start Guide | دليل البدء السريع

### 1. Generate Relational Fixtures from Prisma or SQL
### توليد بيانات تجريبية علائقية من مخطط قاعدة البيانات

Ask your Antigravity agent:
> *"Generate 500 realistic organizations, 2,500 users, and 10,000 orders from my Prisma schema, ensuring referential integrity and zero PII."*

**Example Prisma Schema**:
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  domain    String   @unique
  users     User[]
}

model User {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  email          String       @unique
  fullName       String
}
```

The agent executes topological ordering, instantiating `Organization` records before linking child `User` records, producing production-ready SQL `INSERT` statements or JSON files.

---

### 2. Orchestrate a k6 Load Test with SLA Thresholds
### تشغيل اختبار ضغط باستخدام k6 مع شروط ومقاييس SLA صارمة

Execute a staged ramp-up test targeting your staging API:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 25 },  // Warm-up ramp
    { duration: '2m',  target: 150 }, // Sustained target load
    { duration: '30s', target: 0 },   // Graceful cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of requests must resolve under 250ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors allowed
  },
};

export default function () {
  const res = http.get('https://api.staging.internal/api/v1/products');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

Run via CLI:
```bash
k6 run test.js
```

---

### 3. High-Throughput Node.js Micro-Benchmarking with Autocannon
### اختبار أقصى إنتاجية للمنافذ والخدمات باستخدام Autocannon

```bash
# Benchmark health endpoint with 100 concurrent connections and 10 pipelined requests for 30s
npx autocannon -c 100 -p 10 -d 30 http://localhost:3000/api/health
```

---

## 🛡️ Operational Rules & Safeguards | قواعد السلامة والتشغيل

1. **Zero Real PII (منع استخدام بيانات شخصية حقيقية)**:
   Under no circumstances may production user emails, phone numbers, or credit card records be extracted or exposed in fixtures.
2. **Referential Integrity (تكامل المفاتيح الأجنبية)**:
   Every foreign key must strictly match a generated primary key in parent tables.
3. **Controlled Ramp-Up & Cool-Down (التدرج في أحمال الضغط)**:
   Stress tests must incorporate warm-up and cool-down phases to prevent cascading socket exhaustion and database deadlocks.
4. **Deterministic Seeding (قابلية التكرار الحتمي)**:
   All fixture generators accept a deterministic random seed (`--seed 42`) for 100% reproducible testing in CI/CD pipelines.

---

## 📜 License & Compliance

Designed for developer workflows adhering to GDPR, HIPAA, and CCPA synthetic data anonymization standards.
