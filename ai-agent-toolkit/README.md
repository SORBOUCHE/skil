# AI Agent Toolkit (حزمة بناء وتصميم وكلاء الذكاء الاصطناعي)

[English](#english) | [العربية](#arabic)

---

<a name="english"></a>
## English

### Overview
**AI Agent Toolkit** transforms Antigravity into an expert AI systems architect. This plugin provides end-to-end capabilities for designing, building, evaluating, and deploying autonomous AI agents, multi-agent systems, Retrieval-Augmented Generation (RAG) pipelines, and vector database integrations.

### Features & Included Skills

1. **Agent Pattern Designer (`agent-pattern-designer`)**:
   - Architect production systems using ReAct, Plan-and-Execute, Multi-Agent Orchestration, and Reflexion patterns.
   - Complete Python implementations with the `google-genai` SDK and native tool/function calling.
   - Architectural reference guide with Mermaid flow diagrams.

2. **Prompt Engineer Pro (`prompt-engineer-pro`)**:
   - Master professional system prompt anatomy, Chain-of-Thought (CoT), Tree-of-Thought (ToT), and few-shot exemplars.
   - Deterministic structured outputs using Pydantic schemas and `response_mime_type="application/json"`.
   - Production templates for classification, extraction, reasoning, and synthesis.
   - Failure case analysis and prompt regression testing methodologies.

3. **RAG Pipeline Builder (`rag-pipeline-builder`)**:
   - End-to-end RAG architecture: ingestion, semantic/recursive chunking, embedding generation, dense/sparse hybrid search, and cross-encoder re-ranking.
   - Grounded generation with verifiable citation brackets (`[[SOURCE X]]`).
   - RAG triad evaluation: Context Relevance, Groundedness (Faithfulness), and Answer Relevance.

4. **Vector DB Integration (`vector-db-integration`)**:
   - Configuration and production patterns for Chroma (embedded/local), pgvector (PostgreSQL), Pinecone (managed cloud), and Qdrant (high-throughput self-hosted).
   - High-throughput batch upsert patterns with exponential backoff.
   - Domain-specific schema design for knowledge bases, product catalogs, code search, and episodic conversational memory.

### Project Structure
```text
ai-agent-toolkit/
├── plugin.json
├── README.md
├── rules/
│   └── AGENTS.md
└── skills/
    ├── agent-pattern-designer/
    │   ├── SKILL.md
    │   └── references/
    │       └── patterns-guide.md
    ├── prompt-engineer-pro/
    │   └── SKILL.md
    ├── rag-pipeline-builder/
    │   └── SKILL.md
    └── vector-db-integration/
        └── SKILL.md
```

### Installation
To install the plugin into Antigravity:
```powershell
Copy-Item -Path "e:\اضافات جيميناي\ai-agent-toolkit" -Destination "C:\Users\Admin\.gemini\config\plugins\ai-agent-toolkit" -Recurse -Force
```

---

<a name="arabic"></a>
## العربية

### نظرة عامة
حزمة **AI Agent Toolkit** تحول Antigravity إلى مهندس معماري خبير في أنظمة ووكلاء الذكاء الاصطناعي (AI Systems Architect). توفر هذه الإضافة منظومة متكاملة لتصميم وبناء وتقييم ونشر الوكلاء المستقلين، والأنظمة متعددة الوكلاء (Multi-Agent Systems)، وخطوط أنابيب التوليد المعزز بالاسترجاع (RAG)، والتكامل مع قواعد البيانات المتجهية (Vector Databases).

### المهارات والإمكانيات المتضمنة

1. **مصمم أنماط الوكلاء (`agent-pattern-designer`)**:
   - هندسة وتطبيق أنماط الوكلاء القياسية: نمط ReAct (التفكير والعمل)، ونمط Plan-and-Execute (التخطيط ثم التنفيذ)، ونمط الأوركسترا متعددة الوكلاء، ونمط Reflexion للتأمل والتنقيح الذاتي.
   - أمثلة برمجية عملية بلغة Python باستخدام مكتبة `google-genai` مع استدعاء الأدوات والدوال (Function Calling).
   - دليل مرجعي مدعوم بمخططات انسيابية تفاعلية عبر Mermaid.

2. **مهندس الأوامر المتقدم (`prompt-engineer-pro`)**:
   - تشريح الأوامر المؤسسية الاحترافية (System Prompts)، وسلاسل التفكير (CoT)، وأشجار الأفكار (ToT)، والأمثلة التوجيهية (Few-Shot).
   - ضمان المخرجات الهيكلية عبر مخططات Pydantic وJSON Schemas.
   - قوالب جاهزة لمهام التصنيف، والاستخراج الدقيق، والتحليل المنطقي.
   - منهجيات تتبع الإصدارات واختبارات قياس الجودة (Prompt Regression Testing).

3. **باني خطوط أنابيب الاسترجاع المعزز (`rag-pipeline-builder`)**:
   - معمارية RAG كاملة: تقسيم المستندات الدلالي (Semantic Chunking)، واستخراج التضمينات (Embeddings)، والبحث الهجين (Hybrid Search: Dense + BM25)، وإعادة الترتيب (Re-ranking).
   - التوليد المدعوم بالأدلة والاستشهادات الصريحة (`[[SOURCE X]]`) لمنع الهلوسة.
   - إطار تقييم جودة الاسترجاع وموثوقية الإجابة (RAG Triad).

4. **التكامل مع قواعد البيانات المتجهية (`vector-db-integration`)**:
   - إرشادات الربط والتكوين لمحركات: Chroma (للتطوير المحلي)، pgvector (لقواعد بيانات PostgreSQL)، Pinecone (للسحاب المُدار)، وQdrant (للأداء الفائق).
   - أنماط الإدخال الدفعي عالي الكفاءة (Batch Upsert).
   - تصميم هياكل البيانات الموجهة لعدة مجالات: قواعد المعرفة، كتالوجات المنتجات، البحث في الشيفرات، وذاكرة المحادثات.

### طريقة التثبيت
لتثبيت الإضافة في بيئة Antigravity:
```powershell
Copy-Item -Path "e:\اضافات جيميناي\ai-agent-toolkit" -Destination "C:\Users\Admin\.gemini\config\plugins\ai-agent-toolkit" -Recurse -Force
```
