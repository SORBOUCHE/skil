# Smart Refactor Architect 🏗️⚡
> **Autonomous Codebase Modernization & Clean Architecture Refactoring Plugin**  
> *إضافة جيميناي لإعادة الهيكلة المعمارية المتقدمة وعصرنة الشيفرات البرمجية*

---

## English Documentation

### Overview
`smart-refactor-architect` is an enterprise-grade Antigravity plugin engineered to autonomously modernize legacy codebases, eliminate technical debt, dismantle monolithic "God Classes", and transition applications into clean hexagonal and layered architectures without altering observable runtime behavior.

### Key Capabilities
- **Legacy Code Modernization**:
  - Seamless migration from CommonJS (`require`/`module.exports`) to ECMAScript Modules (ESM).
  - Transformation of callback pyramids and nested `.then()` promise chains into clean, sequential `async`/`await`.
  - Upgrading legacy React Class Components and lifecycle methods to modern functional components and hooks (`useEffect`, `useMemo`, `useCallback`).
  - Python modernization: elimination of Python 2 idioms, adoption of PEP 484/604 static typing, `dataclasses`, and structural pattern matching (`match`/`case`).
  - Replacement of deprecated libraries (e.g., Moment.js, Request, Lodash deep utilities) with modern web standards and native APIs.
- **SOLID Architecture & Decoupling**:
  - Dismantling God Objects into single-responsibility domain entities, use cases, and infrastructure adapters.
  - Implementation of the Repository, Factory, and Strategy design patterns.
  - Strict adherence to the Dependency Inversion Principle (DIP) with Ports and Adapters (Hexagonal Architecture).
  - Isolation of pure business domain logic from side-effectful I/O (Databases, HTTP clients, File system).
- **Test-Protected Refactoring**:
  - Enforces the Two-Hat refactoring discipline (Kent Beck / Martin Fowler).
  - Characterization testing (Golden Master) prior to structural modifications.

### Plugin File Structure
```
smart-refactor-architect/
├── plugin.json                                 # Manifest and suggested prompts
├── README.md                                   # Comprehensive bilingual documentation
├── rules/
│   └── AGENTS.md                               # Strict agent behavioral rules & safety directives
├── skills/
│   ├── legacy-code-modernizer/
│   │   └── SKILL.md                            # Comprehensive modernization guide (ESM, async/await, hooks, Python)
│   └── solid-architecture-decoupler/
│       └── SKILL.md                            # Decoupling monolithic classes into Clean / Hexagonal layers
└── references/
    ├── refactoring-patterns-catalogue.md       # Standard refactoring transformations & code smells
    └── clean-architecture-checklist.md          # Architectural verification and code review checklist
```

### Quick Start Prompts
1. *"Analyze this legacy module and refactor it into clean hexagonal/layered architecture"*
2. *"Modernize this codebase to modern ECMAScript/Python standards and eliminate deprecated patterns"*
3. *"Decouple this god-class into single-responsibility services with dependency injection"*

---

## التوثيق باللغة العربية (Arabic Documentation)

### نبذة عن الإضافة
إضافة **Smart Refactor Architect** هي أداة متطورة مصممة لمساعدة المطورين ووكلاء الذكاء الاصطناعي على تحديث الأكواد البرمجية القديمة (Legacy Code)، والتخلص من الديون التقنية (Technical Debt)، وتفكيك الكائنات المتضخمة (God Objects)، وإعادة هيكلة الأنظمة وفق مبادئ المعمارية النظيفة (Clean Architecture) والمعمارية السداسية (Hexagonal Architecture / Ports & Adapters) مع الحفاظ التام والآمن على السلوك الوظيفي للبرنامج.

### أبرز المزايا والقدرات
1. **عصرنة الشيفرات القديمة (Legacy Code Modernization)**:
   - تحويل مكتبات ومنظومات CommonJS إلى معيار ESM الحديث (`import`/`export`).
   - التخلص من تعقيدات ردود النداء (Callback Hell) وتسلسلات الوعود المعقدة وتحويلها إلى نمط `async/await` الانسيابي والمنظم.
   - تحويل مكونات React القديمة المعتمدة على الفئات (Class Components) ودورات الحياة (Lifecycles) إلى مكونات وظيفية نظيفة باستخدام خطافات React الحديثة (Hooks).
   - تحديث أكواد بايثون القديمة بإضافة التلميحات النوعية الكاملة (PEP 484/604 Type Annotations) واستخدام `dataclasses` ومطابقة الأنماط الهيكلية (`match/case`).
   - استبدال المكتبات الملغاة أو المتقادمة (مثل Moment.js و Request) بحلول الويب القياسية الحديثة ومكتبات الجيل الجديد.

2. **تفكيك المعماريات وتطبيق مبادئ SOLID**:
   - تفكيك الكائنات والخدمات المتضخمة (God Classes) إلى كيانات نطاق محددة ومسؤولة (Single Responsibility).
   - تطبيق نمط المستودع (Repository Pattern) ونمط المصنع (Factory Pattern) ونمط الاستراتيجية (Strategy Pattern).
   - تطبيق مبدأ عكس التبعية (Dependency Inversion Principle) لفصل منطق الأعمال التجاري الخالص (Domain Logic) عن تفاصيل الإدخال والإخراج وقواعد البيانات (I/O).

3. **حماية التغييرات بالاختبارات المؤتمتة**:
   - الالتزام بقاعدة القبعتين (Two-Hat Discipline): الفصل الصارم بين التعديل الهيكلي وإضافة الميزات الجديدة.
   - بناء اختبارات التوصيف (Characterization Tests) قبل البدء بأي عملية تعديل لحماية استقرار النظام.

### هيكل ملفات الإضافة
- `plugin.json`: ملف تعريف الإضافة والأوامر المقترحة.
- `rules/AGENTS.md`: القواعد الصارمة الموجهة للوكيل لضمان عدم كسر العقود أو السلوك أثناء إعادة الهيكلة.
- `skills/legacy-code-modernizer/SKILL.md`: دليل تفصيلي شامل لعصرنة أكواد JavaScript/TypeScript وبايثون.
- `skills/solid-architecture-decoupler/SKILL.md`: دليل عملي مع دراسة حالة كاملة لتفكيك الكائنات المتضخمة إلى معمارية نظيفة.
- `references/refactoring-patterns-catalogue.md`: مرجع لأنماط إعادة الهيكلة الكلاسيكية وطرق حل روائح الشيفرة (Code Smells).
- `references/clean-architecture-checklist.md`: قائمة تحقق للمراجعة المعمارية وضمان جودة الكود.

### أمثلة للأوامر التشغيلية
- *"حلل هذه الوحدة البرمجية القديمة وأعد هيكلتها وفق المعمارية النظيفة والمعمارية السداسية."*
- *"قم بتحديث هذا المشروع إلى معايير ECMAScript / Python الحديثة والتخلص من الأنماط الملغاة."*
- *"فكك هذا الكائن المتضخم (God-Class) إلى خدمات منفصلة تعتمد على حقن التبعية (Dependency Injection)."*

---
## License
MIT License - Developed for Antigravity & Gemini Ecosystem.
