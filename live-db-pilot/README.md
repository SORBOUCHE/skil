# Live DB Pilot & Local Database Explorer 🗄️
### إضافة Antigravity للاستكشاف الحي وتشغيل الاستعلامات على قواعد البيانات المحلية

إضافة متخصصة تمنح **Antigravity** قدرة مباشرة على قراءة وفحص وتشغيل الاستعلامات وتوليد الفهارس على قواعد البيانات المحلية (SQLite، PostgreSQL، MySQL) مع مخدم MCP مدمج يعمل بالكامل بدون أي تبعيات خارجية عبر محرك SQLite الأصلي في **Node.js 22**.

---

## 🌟 القدرات الأساسية (Core Capabilities)

1. **مخدم MCP أصلي مدمج (Native SQLite MCP Engine)**:
   - فحص جداول قواعد البيانات المحلية (`sqlite_inspect_tables`) واستخراج أسماء الحقول وأنواعها والمفاتيح الأساسية.
   - تشغيل استعلامات SQL حية (`sqlite_execute_query`) مع وضع الحماية الافتراضي للقراءة فقط (Read-Only Safety Guard).
   - تحليل خطة الاستعلام (`sqlite_explain_query`) واكتشاف المسح الشامل للجداول (Full Table Scans).
2. **محسن الاستعلامات والفهارس (Query & Index Optimizer)**:
   - مهارة `live-query-optimizer` لتطبيق قاعدة البناء الهرمي للفهارس المركبة (Equality-Range-Sort).
   - توليد عبارات `CREATE INDEX` المثالية لأي استعلام بطيء.
3. **التحقق الآمن من الهجرة (Migration Safety Verifier)**:
   - مهارة `migration-safety-verifier` لتطبيق نمط التوسيع والانكماش (Expand & Contract) لمنع تعطل الأنظمة أثناء التحديث.

---

## 🛠️ أدوات الـ MCP المتاحة

| الأداة | الوصف |
| :--- | :--- |
| `live-db-pilot_sqlite_inspect_tables` | استعراض كافة الجداول وهياكل الحقول وعدد السجلات المقدر |
| `live-db-pilot_sqlite_execute_query` | تشغيل استعلام SQL محلي مع قياس زمن التنفيذ بالميلي ثانية |
| `live-db-pilot_sqlite_explain_query` | تحليل خطة تنفيذ الاستعلام وكشف استخدام الفهارس |
| `live-db-pilot_sql_generate_indexes` | توليد الفهارس المركبة المثلى لأي جدول |
