# Task Orchestrator & Project Manager Plugin
# إضافة مدير المشاريع وتنسيق المهام (Task Orchestrator)

An advanced Antigravity plugin that transforms your AI assistant into an autonomous technical project manager. It breaks down large requirements into structured epics and atomic tasks, tracks progress in `TASKS.md`, detects blockers, and coordinates parallel execution across subagents.

إضافة متطورة لـ Antigravity تحوّل المساعد الذكي إلى مدير مشاريع تقني متكامل؛ حيث يحلل المتطلبات الكبيرة، يفككها إلى مهام قابلة للتنفيذ في ملف `TASKS.md`، يتابع الإنجاز خطوة بخطوة، وينسق العمل المتوازي عبر وكلاء فرعيين (Subagents).

---

## 🚀 Key Features | المزايا الرئيسية

### 🇬🇧 English
- **Epic-to-Tasks Decomposition**: Intelligently decomposes high-level requests into atomic, phased, time-estimated engineering tasks.
- **TASKS.md Tracking**: Real-time markdown task tracking with completion status, dependency tags, and blocker annotations.
- **PreInvocation Task Reminder**: Automatic hook that injects reminders about pending tasks when entering a workspace.
- **Parallel Subagent Coordination**: Identifies independent workstreams and safely dispatches subagents without file conflicts.
- **Project Domain Templates**: Pre-configured templates for REST APIs, Flutter apps, Full-stack web apps, Data pipelines, and AI/ML systems.

### 🇸🇦 العربية
- **تفكيك المتطلبات الكبرى (Epic Decomposition)**: تحويل الأفكار الكبيرة والمشاريع المعقدة إلى مراحل ومهام برمجية صغيرة ومقدرة زمنياً.
- **إدارة التقدم عبر TASKS.md**: متابعة حية لكل مهمة، وتحديد الاعتماديات (Dependencies) وأسباب التوقف (Blockers).
- **تنبيه تلقائي للمهام (Hook)**: تنبيه ذكي قبل كل أمر يذكّر الوكيل بعدد المهام المتبقية والمنجزة.
- **تخطيط العمل المتوازي (Parallel Subagents)**: تقسيم المهام المستقلة وتشغيلها بالتوازي دون تعارض في الملفات.
- **قوالب جاهزة لمختلف المجالات**: قوالب مشاريع للـ REST API، تطبيقات Flutter، تطبيقات الويب الكاملة، خطوط معالجة البيانات، ومشاريع الذكاء الاصطناعي.

---

## 📂 Plugin Structure | هيكل الإضافة

```
task-orchestrator/
├── plugin.json                              # Plugin manifest
├── hooks.json                               # PreInvocation hook registration
├── README.md                                # Bilingual documentation
├── hooks/
│   └── task-reminder.js                     # Node.js hook injecting active task context
├── rules/
│   └── AGENTS.md                            # Orchestrator behavioral rules
└── skills/
    ├── epic-to-tasks-decomposer/
    │   ├── SKILL.md                         # Epic decomposition methodology
    │   └── references/
    │       └── task-templates.md            # Domain templates (API, Flutter, Web, Data, AI)
    ├── progress-tracker/
    │   └── SKILL.md                         # Progress auditing & TASKS.md management
    └── parallel-agent-planner/
        └── SKILL.md                         # Safe parallel subagent execution strategy
```

---

## ⚙️ Installation | التثبيت

### 1. Source Location | مسار المصدر
```
e:\اضافات جيميناي\task-orchestrator\
```

### 2. Copy to Gemini Plugins Directory | النسخ إلى مجلد الإضافات
Run the following PowerShell command:
```powershell
Copy-Item -Path "e:\اضافات جيميناي\task-orchestrator" -Destination "C:\Users\Admin\.gemini\config\plugins\task-orchestrator" -Recurse -Force
```

---

## 📖 Usage Examples | أمثلة الاستخدام

### Example 1: Decomposing an Epic
> **User Prompt:** "Break down building a multi-tenant SaaS authentication system into tasks."
>
> **Orchestrator Output:** Creates a structured `TASKS.md` with Phases, T-shirt effort estimates (XS to XL), and dependency markers.

### Example 2: Resuming Work
> **User Prompt:** "Review my TASKS.md and resume work on the next pending task."
>
> **Orchestrator Output:** Inspects `TASKS.md`, identifies the next unblocked item, notifies the user, and begins execution.

### Example 3: Parallel Execution
> **User Prompt:** "We need both the user settings page and the notification preference API done fast. Can we do them in parallel?"
>
> **Orchestrator Output:** Evaluates independence, verifies no file overlap, and launches dedicated subagents with clear boundary prompts.

---

## 📝 TASKS.md Format | تنسيق ملف المهام

```markdown
# Task: [Feature or Project Name]
_Created: 2026-10-13 | Status: In Progress_

## Phase 1: Setup & Data Layer
- [x] Task 1.1: Project scaffolding and Prisma schema [M - 1h]
- [ ] Task 1.2: Database migration and seed data [S - 30m] (depends on: 1.1)

## Phase 2: Core Features
- [ ] Task 2.1: [PARALLEL-CANDIDATE] Authentication endpoints [L - 2h]
- [ ] Task 2.2: [PARALLEL-CANDIDATE] Dashboard widgets [M - 1h]
- [~] Task 2.3: Stripe webhook listener
  - BLOCKED: Missing STRIPE_WEBHOOK_SECRET
```

---

## 🛡️ License & Standards
Developed for Antigravity AI Agent workflows. Compliant with Antigravity Plugin Specification v1.
