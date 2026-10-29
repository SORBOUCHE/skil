# GitHub Scout & Open-Source Navigator 🚀
### إضافة Antigravity للاتصال بـ GitHub واستكشاف البرمجيات مفتوحة المصدر

إضافة متكاملة لـ **Google Antigravity** تمكّن الوكيل الذكي (Agent) من الاتصال بـ **GitHub**، تصفح المستودعات، البحث عن المشاريع مفتوحة المصدر ذات الصلة بمتطلباتك البرمجية، قراءة الأكواد وتحليل البنى المعمارية، وتقديم مقترحات تحسين ومساهمات (Pull Requests).

---

## ✨ المميزات الرئيسية (Key Features)

1. **البحث الذكي في المشاريع مفتوحة المصدر**:
   - البحث عن مستودعات ومكتبات برمجية حسب اللغة والنجوم والمواضيع (`stars`, `language`, `topics`).
   - استكشاف بدائل مفتوحة المصدر للحلول والخدمات التجارية.
2. **تصفح وقراءة ملفات المشاريع دون تحميل كامل**:
   - قراءة الـ `README.md` ومستندات التصميم مباشرة.
   - استعراض شجرة المجلدات والملفات (`list_directory`).
   - قراءة أكواد الملفات التنفيذية وحزم التبعيات (`package.json`, `pyproject.toml`, وغيرها).
3. **البحث في الأكواد والمشاكل (Code & Issues Search)**:
   - البحث عن أنماط برمجية محددة أو أمثلة لتطبيق دوال ومكتبات.
   - استعراض الـ Issues والـ Pull Requests لمعرفة المشاكل الشائعة وحلولها.
4. **تحسين المشاريع البرمجية وصياغة المساهمات**:
   - تدقيق جودة الكود، الأداء، ومعالجة الأخطاء.
   - صياغة اختبارات وحدوية (Unit Tests).
   - إعداد مسودات مساهمة (Pull Requests) احترافية جاهزة للإرسال.
5. **تنزيل المشاريع محلياً (Download Archive)**:
   - تنزيل أرشيف المستودع وفك ضغطه داخل مجلد العمل بضغطة واحدة.

---

## 🛠️ الأدوات المتاحة (MCP Tools)

تزود هذه الإضافة الوكيل بمخدم MCP مدمج خفيف الوزن وبدون أي تبعيات خارجية (Zero-Dependency Node.js):

| الأداة (Tool) | الوصف |
| :--- | :--- |
| `github-scout_search_repositories` | البحث في مستودعات GitHub وفق معايير متقدمة |
| `github-scout_get_repository` | جلب البيانات التفصيلية لمستودع معين (النجوم، التراخيص، إلخ) |
| `github-scout_get_readme` | قراءة محتوى ملف الـ README الخاص بالمشروع |
| `github-scout_get_file_contents` | قراءة محتوى أي ملف داخل المستودع مباشرة |
| `github-scout_list_directory` | استعراض شجرة المجلدات والملفات داخل المستودع |
| `github-scout_search_code` | البحث عن دوال وأسطر برمجية عبر مستودعات GitHub |
| `github-scout_search_issues` | البحث في المشاكل (Issues) وطلبات الدمج (PRs) |
| `github-scout_get_latest_release` | جلب تفاصيل أحدث إصدار منشور (Release & Changelog) |
| `github-scout_download_repository` | تنزيل وفك ضغط المستودع في مجلد العمل المحلي |

---

## 🧠 المهارات والوكلاء المضمنون (Skills & Agents)

- **المهارة `github-open-source-scout`**:
  توجّه الوكيل للبحث المنهجي عن المشاريع مفتوحة المصدر، مقارنتها في جداول تقييم، والتحقق من التراخيص (`MIT`, `Apache-2.0`, إلخ) وملاءمتها للمشروع.
- **المهارة `github-repo-improver`**:
  توجّه الوكيل لفحص المشاريع، اكتشاف الثغرات والاختناقات الأدائية، وكتابة رقع برمجية واقتراح تحسينات عبر PRs.
- **الوكيل التخصصي `github_researcher`**:
  وكيل فرعي (Subagent) مخصص للقيام بأبحاث متعمقة وموسعة على GitHub دون استهلاك مساحة السياق في المحادثة الرئيسية.

---

## 🔑 المصادقة ومعدل الاستخدام (Authentication & Rate Limits)

- **الوضع الافتراضي (بدون توكن)**:
  تعمل الإضافة فورياً وبدون أي إعدادات بحساب مجهول (Anonymous)، مما يتيح حتى 60 طلباً في الساعة لـ GitHub REST API.
- **الوضع المتقدم (باستخدام GitHub Token)**:
  لرفع حد الطلبات إلى **5,000 طلب/ساعة** والوصول للمستودعات الخاصة، يكفي إضافة متغير البيئة:
  ```powershell
  $env:GITHUB_TOKEN = "ghp_yourPersonalAccessTokenHere"
  ```
  أو إدراجه ضمن ملف `mcp_config.json`.

---

## 📂 بنية الإضافة (Directory Structure)

```text
github-scout/
├── plugin.json                                 # تعريف الإضافة لـ Antigravity
├── README.md                                   # دليل الاستخدام والتوثيق
├── mcp_config.json                             # تهيئة مخدم الـ MCP
├── rules/
│   └── AGENTS.md                               # قواعد وأخلاقيات التعامل مع المصادر المفتوحة
├── skills/
│   ├── github-open-source-scout/               # مهارة استكشاف المشاريع والمقارنة
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── evaluation-criteria.md
│   │       └── search-syntax-guide.md
│   └── github-repo-improver/                   # مهارة فحص وتحسين المشاريع وصياغة PR
│       ├── SKILL.md
│       └── references/
│           ├── code-audit-checklist.md
│           └── pr-contribution-workflow.md
├── agents/
│   └── github-researcher.md                    # وكيل البحث المتخصص
└── mcp/
    ├── server.js                               # خادم MCP سريع ومستقل (Node.js)
    └── test-server.js                          # سكريبت الفحص الذاتي التلقائي
```
