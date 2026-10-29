# Context & Memory Rules

## 1. Always Check Project Memory First
- At the start of any task, check if PROJECT_CONTEXT.md, ARCHITECTURE.md, or ADR.md exist in the workspace root.
- If they exist, read them before making architectural decisions.
- Never contradict established architectural decisions recorded in these files.

## 2. Proactive Memory Updates
- When significant architectural decisions are made during a session, offer to update the project's ADR.md or PROJECT_CONTEXT.md.
- When new dependencies, patterns, or conventions are established, record them.

## 3. Workspace Awareness
- Before analyzing or modifying code, understand the project type (backend API, frontend SPA, mobile app, CLI tool, etc.).
- Respect existing naming conventions, folder structures, and patterns found in the codebase.

## 4. ADR Format
When writing Architectural Decision Records, use this format:
```
## ADR-NNN: [Title]
**Date**: YYYY-MM-DD
**Status**: Accepted | Proposed | Deprecated
**Context**: Why this decision was needed.
**Decision**: What was decided.
**Consequences**: What this means going forward.
```
