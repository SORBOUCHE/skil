# Performance Profiler Plugin / إضافة خبير تحليل وضبط الأداء

[English](#english) | [العربية](#العربية)

---

## English

### Overview
**Performance Profiler** is a full-lifecycle performance engineering plugin for Antigravity. It transforms the AI agent into an expert performance engineer capable of diagnosing, profiling, and optimizing frontend user interfaces, backend services, database workloads, and mobile applications.

It includes an automated **Pre-Deploy Bundle Size Gate hook** that inspects build artifacts and warns if client JavaScript bundles breach performance budgets.

---

### Key Components

#### 1. Skills
- **`frontend-perf-optimizer`**:
  - Deep-dive diagnosis and remediation of **Core Web Vitals** (LCP < 2.5s, INP < 200ms, CLS < 0.1).
  - Modern bundle analysis (Vite visualizer, Webpack Bundle Analyzer, source-map-explorer).
  - Advanced code-splitting (route-based, dynamic imports, vendor chunks).
  - Image/asset loading optimization (WebP/AVIF, responsive `srcset`, layout aspect ratios).
  - React/DOM optimizations (memoization, render trees, virtualization with `@tanstack/react-virtual`).
  - Reference guide: `web-vitals-targets.md`.

- **`backend-perf-tuner`**:
  - Scientific profiling methodology (baselines, tail latencies p95/p99, load testing with autocannon/k6).
  - Database optimization: `EXPLAIN ANALYZE` execution plan breakdown, composite/covering/partial indexes, N+1 query elimination, connection pooling (PgBouncer).
  - High-throughput API design (Brotli compression, HTTP/2, cursor-based pagination, field projections).
  - Node.js event loop tuning (clinic.js, worker threads, stream processing).
  - Python performance tuning (asyncio, uvloop, gunicorn workers, py-spy profiling).
  - Reference guide: `sql-optimization-patterns.md`.

- **`memory-leak-detective`**:
  - Systematic heap snapshot analysis in Chrome DevTools using the 3-snapshot comparison technique.
  - Identification of common leak sources: uncleaned event listeners, closure traps, unbounded in-memory caches, circular references.
  - WeakRef & WeakMap patterns for safe object metadata management.
  - Python leak tracking (`tracemalloc`, `objgraph`, line-by-line memory profiling).
  - Flutter & Dart memory leak prevention (`dispose()` methods, uncancelled StreamSubscriptions).
  - Automated memory regression testing with `--expose-gc`.

#### 2. Pre-Deploy Bundle Size Gate Hook (`bundle-gate.js`)
- Runs automatically after `run_command` via PostToolUse.
- Detects build commands (`npm run build`, `vite build`, `next build`, etc.).
- Recursively inspects output directories (`dist`, `.next`, `build`, `out`, `www`).
- Calculates total JavaScript size and issues an immediate warning if it exceeds the **1MB (1024KB)** performance budget.

#### 3. Performance Engineering Rules (`rules/AGENTS.md`)
- Authoritative rules enforcing the "Always measure before optimizing" discipline, Core Web Vitals thresholds, latency baselines, non-blocking I/O, connection pooling, and multi-tier caching.

---

### Example Prompts
- *"Analyze my frontend bundle, identify what's killing my LCP score and how to fix it."*
- *"Profile my Node.js backend and find the memory leak causing OOM crashes in production."*
- *"Audit my SQL queries and API response times, then give me a prioritized optimization plan."*
- *"Our Next.js app has high INP on mobile devices. Trace the main-thread blocking tasks."*

---

## العربية

### نظرة عامة
**Performance Profiler** هي إضافة هندسية متكاملة لـ Antigravity، تُحوّل المساعد الذكي إلى مهندس أداء متقدم متخصص في تشخيص وتحسين سرعة وكفاءة تطبيقات الويب، والخدمات الخلفية (Backends)، وقواعد البيانات، وتطبيقات الهواتف الذكية.

تحتوي الإضافة أيضاً على خطاف فحص آلي (**Bundle Size Gate Hook**) يُراقب أحجام حزم JavaScript الناتجة عن عمليات البناء (Build) ويُطلق تنبيهات فورية عند تجاوز ميزانية الأداء المحددة.

---

### المكونات الرئيسية

#### 1. المهارات (Skills)
- **`frontend-perf-optimizer` (تحسين أداء الواجهات الأمامية)**:
  - تشخيص وحل مشاكل مؤشرات أداء الويب الحيوية (**Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1).
  - تحليل حزم الكود (Bundle Analysis) وتقسيم الشيفرة (Code Splitting).
  - تحسين الصور والأصول الرقمية وضمان عدم حدوث انزياحات في التنسيق (CLS).
  - تسريع تطبيقات React ومنع إعادة التصيير غير الضرورية واستخدام التصفح الافتراضي (Virtualization).
  - ملف مرجعي: `web-vitals-targets.md`.

- **`backend-perf-tuner` (ضبط أداء الأنظمة الخلفية)**:
  - منهجية القياس العلمي (تحديد خطوط الأساس وأوقات الاستجابة p95 و p99 واختبارات الحمل).
  - تحسين قواعد البيانات: قراءة خطط التنفيذ `EXPLAIN ANALYZE`، الفهارس المركبة والمغطية، القضاء على مشكلة N+1، إدارة أحواض الاتصال (Connection Pooling).
  - تسريع واجهات البرمجة (APIs): ضغط Brotli، الترقيم القائم على المؤشر (Cursor Pagination)، وتصفية الحقول المسترجعة.
  - ضبط أداء Node.js و Python ومعالجة انسداد حلقة الأحداث (Event Loop).
  - ملف مرجعي: `sql-optimization-patterns.md`.

- **`memory-leak-detective` (محقق تسريبات الذاكرة)**:
  - تحليل لقطات الذاكرة (Heap Snapshots) في Chrome DevTools بمنهجية اللقطات الثلاث.
  - اكتشاف تسريبات مستمعي الأحداث (Event Listeners)، وفخاخ الإغلاق (Closure Traps)، والذاكرة المؤقتة غير المحدودة.
  - كشف تسريبات الذاكرة في Python وتطبيقات Flutter/Dart (التخلص من وحدات التحكم وإلغاء اشتراكات الـ Streams).
  - كتابة اختبارات آلية لمنع تكرار تسريبات الذاكرة باستخدام `--expose-gc`.

#### 2. خطاف بوابة حجم الحزم (`bundle-gate.js`)
- يعمل تلقائياً بعد أوامر البناء عبر آلية PostToolUse.
- يتحقق من أحجام ملفات الـ JS في مجلدات الإخراج (`dist`, `.next`, `build`).
- يُطلق تحذيراً فورياً إذا تجاوز الحجم الكلي ميزانية **1 ميجابايت**.

#### 3. قواعد هندسة الأداء (`rules/AGENTS.md`)
- إرشادات صارمة تلزم بالقياس الدقيق قبل التحسين، ومنع حظر المسار الساخن، والاعتماد الدائم على التخزين المؤقت متعدد الطبقات وأحواض الاتصال.

---

### أمثلة على الطلبات المقترحة
- *"حلل حزمة الواجهة الأمامية وحدد ما يضر بمؤشر LCP وكيفية إصلاحه."*
- *"افحص خادم Node.js واكتشف تسريب الذاكرة الذي يسبب انهيار OOM في الإنتاج."*
- *"راجع استعلامات SQL وأوقات استجابة الـ API وزودني بخطة تحسين ذات أولوية."*
