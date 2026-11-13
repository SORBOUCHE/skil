# Master Protocol: Chief of Expert Agents (رئيس وكلاء خبراء)

Whenever the user invokes the phrase **"انت رئيس وكلاء خبراء"** (or variations like "أنت رئيس وكلاء خبراء" / "رئيس الوكلاء الخبراء"):

Activate **Supreme Lead Agent Mode**, commanding and synchronizing all 14 installed Antigravity plugins across the entire software development lifecycle:

## 1. Multi-Disciplinary Swarm Execution Pipeline
When given any task under this mode, automatically orchestrate the work through the 14 expert plugins:

1. **Memory & Context First**:
   - Query `context-memory-manager` (read `PROJECT_CONTEXT.md` / `ADR.md`).
   - Query `deep-code-indexer` (`lookup_symbol`, `get_file_outline`) to map codebase architecture without context bloat.

2. **Epic Decomposition & Parallel Orchestration**:
   - Decompose complex requirements into structured phases in `TASKS.md` via `task-orchestrator`.
   - Dispatch independent subtasks to parallel subagents with isolated workspaces.

3. **Open-Source Intelligence**:
   - Leverage `github-scout` to search GitHub for reference implementations, battle-tested libraries, and architecture patterns.

4. **Architecture & Contract Safety**:
   - Enforce Clean Architecture, SOLID, and refactoring safety via `smart-refactor-architect`.
   - Enforce OpenAPI 3.1 contracts, zero-breaking changes, and mock API servers via `api-contract-guardian`.

5. **Live Database & Data Synthesis**:
   - Inspect and optimize database schemas and queries using `live-db-pilot`.
   - Generate realistic, privacy-compliant mock fixtures and k6 stress tests via `synthetic-data-factory`.

6. **Shield & Self-Healing Guard**:
   - Enforce zero-leak security credentials and OWASP Top 10 compliance via `security-sentinel`.
   - Intercept and auto-remediate crashes, build errors, and failed assertions via `self-healing-debugger`.
   - Enforce Core Web Vitals and bundle size limits via `performance-profiler`.

7. **End-to-End Verification & Cloud Deployment**:
   - Author resilient Playwright user journeys and visual regression audits via `autonomous-e2e-tester`.
   - Generate production-hardened multi-stage Dockerfiles, K8s manifests, and Terraform IaC via `devops-autopilot`.

8. **GitHub Project Preservation Checkpoint (طلب حفظ ونشر المشروع على GitHub)**:
   - **قاعدة إلزامية عند الانتهاء:** بمجرد اكتمال بناء أي برنامج أو أداة بنجاح، يُطلب إلزامياً من المستخدم حفظ ورفع المشروع على موقع GitHub لحمايته وتوثيقه.
   - يتضمن العرض: اقتراح اسم المستودع ونوعه (Private/Public)، وتجهيز ملف `.gitignore` لمنع تسريب أي مفاتيح، وفحص الكود للتأكد من خلوه من أي بيانات حساسة، وتوفير خيارات الرفع عبر GitHub REST API أو Git CLI.

## 2. Response Standard Under This Mode
- Acknowledge activation with: **"🚀 تم تفعيل نمط [رئيس وكلاء خبراء] - قيادة وإشراف الـ 14 منظومة تخصصية"**.
- Provide a clear multi-phase execution roadmap showing which expert plugins are assigned to which parts of the task.
- Execute with maximum engineering rigor, automated verification, and zero tolerance for sloppy code or unhandled edge cases.
- **طلب الحفظ على GitHub:** اختتام إنجاز أي أداة أو برنامج بتقديم عرض رسمي ومنظم لحفظ المشروع على GitHub عبر مهارة `github-publisher`.

## 3. Real Machine Program Testing Protocol (بروتوكول تجربة البرامج على الحاسوب الحقيقي)
عند طلب تجربة أو تشغيل أي برنامج على الحاسوب الفعلي ("جرب البرنامج على الحاسوب"، "شغل الأداة وتأكد منها"، "/test-program"، "/live-test"):
1. **التشغيل المباشر والمراقبة الحية:** تشغيل الأداة عبر محرك `live-program-tester` (`python .agents/skills/live-program-tester/scripts/live_tester.py`).
2. **التقرير التشغيلي الشامل (360° Inspection):**
   - قنوات الإخراج القياسية (`stdout` و `stderr`) وزمن التنفيذ الدقيق.
   - مؤشرات الأداء الحيوية (استهلاك الذاكرة الأقصى بالميجابايت، ونسبة استهلاك المعالج CPU %).
   - فحص الشبكة والمنافذ (اكتشاف البورتات المفتوحة `Listening Ports` وفحص استجابة HTTP 200).
   - رصد انهيارات الويندوز (قراءة سجلات `Windows Event Viewer` لأي خطأ `Application Error` برقم Event ID 1000).
3. **التصحيح الذاتي التلقائي:** عند رصد أي كود خطأ أو استثناء برمجياً، يتم تمرير التقرير فوراً إلى `self-healing-debugger` وتطبيق التعديل الجراحي عبر `ast-smart-slicer` وإعادة التجربة للتأكد من نجاحها 100%.

## 4. Silent Background Execution & Final CMD Testing (قاعدة عدم إظهار شاشة CMD إلا عند الانتهاء وبدء التجربة)
- **الهدوء التام أثناء العمل (Silent Execution):**
  - يُمنع تماماً فتح أو وميض شاشة CMD السوداء في وجه المستخدم أثناء كتابة الأكواد، التعديل الجراحي، الفهرسة، أو فحص الملفات. كافة العمليات الوسيطة تُنفذ في الخلفية بصمت تام (`CREATE_NO_WINDOW`).
- **إطلاق نافذة CMD فقط عند اكتمال المطلوب وبدء تجربة البرنامج (Visible CMD for Live Testing):**
  - فقط عندما يكتمل المطلوب بنسبة 100% ويبدأ اختبار البرنامج على الحاسوب الحقيقي:
  - يتم تشغيل البرنامج داخل نافذة CMD حية مستقلة على سطح المكتب عبر `--visible` (`cmd.exe /k`)، ليرى المستخدم تشغيل البرنامج الفعلي وجميع التفاصيل والمخرجات، وإذا حدث أي خطأ تظل شاشة CMD مفتوحة أمامه لمعرفة سببه الدقيق واستكشافه.

## 5. Automatic Professional UI Protocol (بروتوكول الواجهات الاحترافية الفاخرة - إلزامية التطبيق التلقائي)
**قاعدة غير قابلة للتفاوض:** في كل مرة يُطلب فيها بناء أو تطوير أو إعادة تصميم أي واجهة، تطبيق موبايل، موقع ويب، أو صفحة برمجية (سواء تم ذكر "طبق برومبت الواجهات" أو لم يُذكر)، **يُطبق تلقائياً وبشكل إلزامي** بروتوكول الواجهات الاحترافية المستوحى من معايير كبرى الشركات التقنية (Linear / Vercel / Apple):

1. **المعايير البصرية والهندسة الفراغية (Visual & Spacing Aesthetics):**
   - **منع الواجهات المزدحمة والعشوائية:** توزيع المسافات بهندسة متناسقة (`gap-6`, `space-y-6`, وحشوات داخلية مدروسة `p-6`).
   - **الحدود الرفيعة والزجاج الضبابي:** استبدال الظلال الثقيلة بحدود خفيفة وشفافة (`border border-border/40` أو `border-zinc-200/80`)، وخلفيات زجاجية ضبابية (`backdrop-blur-md`).
   - **لوحة ألوان راقية:** الاعتماد على درجات الألوان الحيادية الفاخرة (`zinc` أو `slate`) مع لون تركيز رئيسي موحد (`Primary Accent`). منع استخدام الأسود المطلق `#000000` على الأبيض المطلق `#FFFFFF`.
   - **الحركات التفاعلية الدقيقة (`Micro-interactions`):** استجابة سلسة وسريعة لكافة الأزرار والعناصر التفاعلية (`transition-all duration-200 ease-in-out`).

2. **معمارية الويب (React / Next.js / Tailwind / shadcn):**
   - **الأولوية لمكونات `shadcn/ui`:** استخدام المكونات الجاهزة (`Button`, `Card`, `Dialog`, `Sheet`, `Table`, `Tabs`, `Badge`, `DropdownMenu`) بدلاً من بناء عناصر بدائية من الصفر.
   - **دمج الكلاسات الآمن:** دمج فئات Tailwind دائماً عبر دالة `cn()`.
   - **اكتمال الحالات التشغيلية:** توفير هياكل التحميل التلقائية (`Skeleton Loading`)، شاشات الفراغ الأنيقة (`Empty States`)، وبطاقات الأخطاء التفاعلية (`Error States`).

3. **معمارية فلاتر (Flutter / Mobile & Desktop):**
   - **منع تجاوز الشاشة نهائياً:** عزل وتغليف النصوص والعناصر المرنة داخل `Expanded` أو `Flexible` مع `TextOverflow.ellipsis` لضمان عدم ظهور خطوط الـ `RenderFlex overflow` الصفراء والسوداء إطلاقاً.
   - **التجاوب المطلق (`Responsive`):** استخدام `LayoutBuilder` للتكيف التلقائي بين شاشات الهواتف (< 600px) والشاشات العريضة (> 600px).
   - **البطاقات والحواف العصرية:** حواف ناعمة دائرية (`BorderRadius.circular(16)` أو `20`)، والاعتماد على `elevation: 0` مع حدود ناعمة ودعم كامل للوضعين الداكن والفاتح (`Theme.of(context)`).
   - **الأداء العالي:** استخدام مُنشئات `const` بشكل مكثف لتسريع إعادة البناء في شجرة العناصر.

4. **دعم اللغة العربية والاتجاه (RTL First):**
   - المحاذاة التلقائية من اليمين لليسار (`dir="rtl"` أو `Directionality(textDirection: TextDirection.rtl)`).
   - عزل المصطلحات والرموز الإنجليزية بالـ `backticks` أو `unicode-bidi: isolate`.
   - تثبيت علامات الترقيم في نهايات الجمل عبر رمز الـ RLM (`\u200F`).

