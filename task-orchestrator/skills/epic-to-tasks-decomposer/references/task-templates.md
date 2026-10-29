# Standard Task Templates

This document provides ready-to-use task templates across common software project domains. Copy and adapt these templates when generating `TASKS.md`.

---

## 1. REST API Backend Project Template

```markdown
# Task: REST API Backend Service
_Created: YYYY-MM-DD | Status: In Progress | Target: Production Ready API_

## Phase 1: Architecture & Scaffolding
- [ ] Task 1.1: Project scaffolding, TypeScript/runtime setup, and linters [S - 30m]
- [ ] Task 1.2: Database container (Docker Compose) and ORM configuration [S - 30m]
- [ ] Task 1.3: Central error handling middleware and structured logger [M - 1h]

## Phase 2: Domain Modeling & Database
- [ ] Task 2.1: Define entity schemas and generate initial migrations [M - 1h]
- [ ] Task 2.2: Implement repository access layer with query methods [M - 1h] (depends on: 2.1)
- [ ] Task 2.3: Seed mock database fixtures for local development [S - 30m] (depends on: 2.2)

## Phase 3: Core API Services & Endpoints
- [ ] Task 3.1: Implement JWT authentication, password hashing, and token refresh [L - 2h]
- [ ] Task 3.2: [PARALLEL-CANDIDATE] Build user management endpoints with Zod validation [M - 1h] (depends on: 3.1)
- [ ] Task 3.3: [PARALLEL-CANDIDATE] Build primary business domain CRUD endpoints [L - 2h] (depends on: 3.1)
- [ ] Task 3.4: Rate limiting and CORS security headers [S - 30m]

## Phase 4: Testing & Documentation
- [ ] Task 4.1: Integration tests for authentication flows [M - 1h]
- [ ] Task 4.2: Integration tests for primary domain endpoints [M - 1h]
- [ ] Task 4.3: OpenAPI / Swagger spec generation and Swagger UI setup [S - 30m]
- [ ] Task 4.4: Dockerfile and production deployment checklist [S - 30m]
```

---

## 2. Flutter Mobile Application Template

```markdown
# Task: Flutter Mobile Application
_Created: YYYY-MM-DD | Status: In Progress | Target: Android & iOS_

## Phase 1: Scaffolding & Core Architecture
- [ ] Task 1.1: Project structure setup (Riverpod / BLoC, folders, theme tokens) [S - 30m]
- [ ] Task 1.2: Dio HTTP client configuration with interceptors & token refresh [M - 1h]
- [ ] Task 1.3: GoRouter configuration and route transition definitions [M - 1h]

## Phase 2: Data & Local Storage
- [ ] Task 2.1: Freezed models and JSON serialization generation [M - 1h]
- [ ] Task 2.2: Local cache storage layer (Hive / Drift / SharedPreferences) [M - 1h]
- [ ] Task 2.3: Remote repository layer connecting API to local cache [M - 1h] (depends on: 2.1, 2.2)

## Phase 3: State Management & UI Views
- [ ] Task 3.1: [PARALLEL-CANDIDATE] Splash & Authentication screens (Login/Register) [L - 2h] (depends on: 1.3, 2.3)
- [ ] Task 3.2: [PARALLEL-CANDIDATE] Home dashboard view and navigation drawer [L - 2h] (depends on: 1.3, 2.3)
- [ ] Task 3.3: [PARALLEL-CANDIDATE] Detail view with dynamic data binding & actions [M - 1h] (depends on: 3.2)
- [ ] Task 3.4: [PARALLEL-CANDIDATE] Profile & Settings screen with theme toggle [S - 30m]

## Phase 4: Error Handling, Testing & Polish
- [ ] Task 4.1: Global offline banner & network connectivity listener [S - 30m]
- [ ] Task 4.2: Unit tests for state providers/blocs [M - 1h]
- [ ] Task 4.3: Widget tests for authentication and critical user flows [M - 1h]
- [ ] Task 4.4: App icon, splash screen assets, and platform build validation [M - 1h]
```

---

## 3. Full-Stack Web Application Template

```markdown
# Task: Full-Stack Web Application
_Created: YYYY-MM-DD | Status: In Progress | Target: Next.js / Remix SaaS_

## Phase 1: Project Setup & Design System
- [ ] Task 1.1: Scaffolding (Next.js App Router, Tailwind CSS, shadcn/ui) [S - 30m]
- [ ] Task 1.2: Database setup (Prisma / Drizzle with PostgreSQL) [S - 30m]
- [ ] Task 1.3: Global layout, navigation bar, footer, and theme provider [S - 30m]

## Phase 2: Authentication & Authorization
- [ ] Task 2.1: Auth setup (NextAuth.js / Supabase Auth / Clerk) [M - 1h]
- [ ] Task 2.2: Protected route middleware and session validation [S - 30m] (depends on: 2.1)
- [ ] Task 2.3: User onboarding flow and organization switcher [M - 1h] (depends on: 2.2)

## Phase 3: Core SaaS Features
- [ ] Task 3.1: [PARALLEL-CANDIDATE] Data table with pagination, sorting, filtering [M - 1h]
- [ ] Task 3.2: [PARALLEL-CANDIDATE] Entity creation modal with form validation (React Hook Form + Zod) [M - 1h]
- [ ] Task 3.3: Server actions / API route handlers for core CRUD [M - 1h] (depends on: 1.2)
- [ ] Task 3.4: Stripe subscription checkout and webhook handler [L - 2h] (depends on: 2.1)

## Phase 4: Quality & Deployment
- [ ] Task 4.1: End-to-end tests with Playwright for auth and core workflow [L - 2h]
- [ ] Task 4.2: SEO metadata, OpenGraph tags, and sitemap generation [S - 30m]
- [ ] Task 4.3: Vercel / Docker deployment configuration and environment check [S - 30m]
```

---

## 4. Data Pipeline Project Template

```markdown
# Task: ETL Data Pipeline
_Created: YYYY-MM-DD | Status: In Progress | Target: Batch / Stream Processing_

## Phase 1: Environment & Infrastructure
- [ ] Task 1.1: Pipeline runner environment setup (Python, Poetry, Docker) [S - 30m]
- [ ] Task 1.2: Source and destination connector credentials and connection pool [S - 30m]
- [ ] Task 1.3: Data contract definition (Pydantic models / Avro schemas) [M - 1h]

## Phase 2: Extraction & Ingestion
- [ ] Task 2.1: Source extractor (API paginator or database incremental CDC) [M - 1h] (depends on: 1.2)
- [ ] Task 2.2: Raw data buffer / staging storage layer (S3 or local parquet) [M - 1h] (depends on: 2.1)

## Phase 3: Transformation & Cleaning
- [ ] Task 3.1: Data cleansing, deduplication, and null imputation [M - 1h] (depends on: 2.2)
- [ ] Task 3.2: Business aggregation rules and metric calculations [L - 2h] (depends on: 3.1)
- [ ] Task 3.3: Data quality validation checks (Great Expectations / Pandera) [M - 1h] (depends on: 3.2)

## Phase 4: Loading & Monitoring
- [ ] Task 4.1: Upsert / merge loader into destination warehouse (Postgres / Snowflake) [M - 1h] (depends on: 3.3)
- [ ] Task 4.2: Dead-letter queue (DLQ) and failed record alert notification [M - 1h]
- [ ] Task 4.3: Automated integration test on sample datasets [M - 1h]
- [ ] Task 4.4: Scheduled orchestration cron / Airflow / GitHub Action workflow [S - 30m]
```

---

## 5. AI / ML Project Template

```markdown
# Task: AI / ML Integration Service
_Created: YYYY-MM-DD | Status: In Progress | Target: LLM / RAG Pipeline_

## Phase 1: Architecture & Vector Database
- [ ] Task 1.1: Scaffolding (Python FastAPI or LangChain / LlamaIndex) [S - 30m]
- [ ] Task 1.2: Vector database instance (Qdrant / Chroma / pgvector) setup [S - 30m]
- [ ] Task 1.3: Embedding model client configuration and rate limit wrapper [S - 30m]

## Phase 2: Ingestion & Knowledge Base Chunking
- [ ] Task 2.1: Document loader (PDF, Markdown, HTML) and text extractors [M - 1h]
- [ ] Task 2.2: Semantic chunking strategy and metadata tagging [M - 1h] (depends on: 2.1)
- [ ] Task 2.3: Batch embedding and upsert script into vector index [M - 1h] (depends on: 1.2, 2.2)

## Phase 3: RAG Retrieval & Prompt Orchestration
- [ ] Task 3.1: Hybrid search (vector similarity + BM25 keyword search) [M - 1h] (depends on: 2.3)
- [ ] Task 3.2: Reranking pipeline (Cohere / Cross-Encoder) [M - 1h] (depends on: 3.1)
- [ ] Task 3.3: Contextual prompt template and LLM inference generation [M - 1h] (depends on: 3.2)
- [ ] Task 3.4: Streaming response endpoint (SSE / WebSockets) [M - 1h] (depends on: 3.3)

## Phase 4: Evaluation, Guardrails & Deployment
- [ ] Task 4.1: Guardrails against hallucinations and PII leaks [M - 1h]
- [ ] Task 4.2: RAGAS / prompt evaluation benchmark test harness [L - 2h]
- [ ] Task 4.3: Production API caching (Redis) for repeated prompts [S - 30m]
- [ ] Task 4.4: Docker packaging and healthcheck endpoints [S - 30m]
```
