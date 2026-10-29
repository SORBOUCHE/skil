---
name: epic-to-tasks-decomposer
description: Decomposes complex feature epics and architectural requirements into atomic, ordered, and verifiable tasks in TASKS.md.
---

# Epic to Tasks Decomposer Skill

## Overview
The `epic-to-tasks-decomposer` skill transforms broad user visions, epics, feature requests, or complex architectural requirements into structured, actionable, and logically ordered engineering tasks documented in `TASKS.md`.

---

## When to Activate
Activate this skill whenever:
- The user requests a large feature, refactor, migration, or greenfield application.
- The request requires more than 3 distinct development steps or spans multiple domains (e.g., backend, frontend, database, DevOps).
- The user asks for a project roadmap, implementation plan, or breakdown.
- Ambiguous or high-level requirements need scoping before code is written.

---

## Step-by-Step Decomposition Process

### Step 1: Clarify Scope and Requirements
Before creating tasks, ensure all foundational unknowns are addressed:
1. **Target Stack & Constraints**: Confirm runtime, frameworks, database systems, and deployment targets.
2. **Acceptance Criteria**: What defines "done" for the overarching epic?
3. **Out-of-Scope Items**: Explicitly isolate features deferred to later milestones.
4. **Clarification Protocol**: If requirements contain critical ambiguities, ask up to 3 targeted questions immediately.

### Step 2: Identify Development Phases
Organize the work into logical phases:
- **Phase 1: Architecture & Design**: Schema design, API contracts, sequence diagrams, tech stack choices.
- **Phase 2: Project Setup & Tooling**: Scaffolding, dependency installation, linting, test runners, environment variables.
- **Phase 3: Data Layer & Core Domain**: Models, database migrations, repositories, core business logic entities.
- **Phase 4: API & Service Implementation**: Endpoints, business services, validation, auth middlewares.
- **Phase 5: UI & Client Implementation**: Screens, state management, API client integration, user feedback.
- **Phase 6: Verification & Testing**: Unit tests, integration tests, E2E flows, performance benchmarks.
- **Phase 7: Documentation & Deployment**: Deployment scripts, CI/CD pipelines, README, runbooks.

### Step 3: Break Down into Atomic Tasks
Every task must satisfy the **INVEST** principle adjusted for development agents:
- **Independent**: Can be worked on with minimal coupling to other in-flight tasks.
- **Verifiable**: Has a clear test command or manual check confirming success.
- **Scoped**: Sized between 15 minutes and 2 hours (never exceeding 4 hours).
- **Explicit**: Specifies concrete file paths, endpoints, or components to touch.

### Step 4: Map Task Dependencies
For each task, determine:
- **Pre-requisites**: Which tasks must be marked `[x]` before this can begin?
- **Blockers**: Any external APIs, API keys, or assets needed?
- Annotate dependencies with tag references (e.g., `(depends on: #1.2)`).

### Step 5: Identify Parallel Workstreams
Cluster independent tasks into parallel tracks:
- Track A: Database models & backend endpoints.
- Track B: Frontend mock UI and component library.
- Track C: Test scaffolding and seed fixtures.
Label tasks with `[PARALLEL-CANDIDATE]` when subagents can run concurrently without file collisions.

### Step 6: Effort Estimation (T-Shirt Sizing)
Apply standard developer effort sizes:
- **XS (Extra Small - 15m)**: Configuration tweak, single endpoint parameter, simple model field.
- **S (Small - 30m)**: Standalone utility function, simple CRUD endpoint, UI button/form field.
- **M (Medium - 1h)**: Multi-step service logic, complex database query/migration, screen with state.
- **L (Large - 2h)**: Authentication flow, third-party webhook integration, multi-screen navigation flow.
- **XL (Extra Large - 4h)**: Core architectural rewrite, database clustering, heavy algorithmic engine (split into smaller tasks if possible).

### Step 7: Generate and Write TASKS.md
Save the plan to `TASKS.md` in the workspace root following the standardized project template.

---

## TASKS.md Document Standard

```markdown
# Task: [Feature or Project Name]
_Created: YYYY-MM-DD | Status: In Progress | Estimated Effort: [Total Hours]_

## Overview
Brief 2-3 sentence summary of the project scope and success criteria.

## Phase 1: Environment & Setup
- [ ] Task 1.1: Initialize project repository and configure dependencies [XS - 15m]
- [ ] Task 1.2: Setup database container and `.env.example` [S - 30m]

## Phase 2: Core Implementation
- [ ] Task 2.1: Define User and Workspace database models [M - 1h] (depends on: 1.2)
- [ ] Task 2.2: Implement JWT authentication service and middleware [L - 2h] (depends on: 2.1)
- [ ] Task 2.3: [PARALLEL-CANDIDATE] Build email notification service [M - 1h]

## Phase 3: Verification & Polishing
- [ ] Task 3.1: Write integration tests for auth routes [M - 1h]
- [ ] Task 3.2: Update API documentation and README [S - 30m]
```

---

## Good vs. Bad Task Decomposition

| Aspect | Bad Decomposition | Good Decomposition |
| :--- | :--- | :--- |
| **Granularity** | `Build backend API` (too vague, giant scope) | `Create POST /api/v1/auth/register endpoint with bcrypt hashing and zod validation` |
| **Actionability** | `Work on database` | `Write Prisma schema for User & Organization with 1:N relation and migration script` |
| **Verification** | `Make frontend look good` | `Implement Dashboard stats card matching Tailwind design tokens with loading skeleton` |
| **Dependencies**| `Do tests and finish deployment` | `Add Jest tests for PaymentService; depends on Task 3.2 (Stripe webhook handler)` |

---

## Architectural Templates by Domain

### 1. REST API Backend
- Phase 1: Architecture, database schema, migration tooling.
- Phase 2: Domain models, repository layer, database seeding.
- Phase 3: Service business logic and validation schemas.
- Phase 4: HTTP controllers, routing, authentication & authorization middleware.
- Phase 5: Integration testing, swagger/OpenAPI generation, error monitoring.

### 2. Flutter Mobile Application
- Phase 1: Project structure, dependency injection (`get_it`/`riverpod`), theme configuration.
- Phase 2: Data models (`freezed`/`json_serializable`) and API client (`dio`).
- Phase 3: Repository layer and offline caching (`drift`/`hive`).
- Phase 4: State management controllers and business logic.
- Phase 5: UI presentation widgets, navigation routing (`go_router`), form validation.
- Phase 6: Unit and widget tests, platform build verification (Android/iOS).

### 3. CLI Tool
- Phase 1: CLI arguments parser setup (`commander`/`yargs`/`clap`).
- Phase 2: Configuration file loader and validator (`~/.config/<tool>`).
- Phase 3: Core execution commands and sub-commands.
- Phase 4: Terminal formatting, spinner/progress bar, interactive prompts.
- Phase 5: Error handling, help manual, package distribution bundle.

### 4. Data Pipeline
- Phase 1: Data source connector and schema ingestion contracts.
- Phase 2: Transformation logic, sanitization, and deduplication pipeline.
- Phase 3: Destination storage sink (PostgreSQL, ClickHouse, S3).
- Phase 4: Error queue, dead-letter storage, telemetry and metrics.
- Phase 5: Automated pipeline tests with mock data fixtures.
