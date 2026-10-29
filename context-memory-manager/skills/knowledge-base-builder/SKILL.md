---
name: knowledge-base-builder
description: Helps create and maintain a team knowledge base of architectural decisions (ADRs), runbooks, and project conventions. Use when the user wants to document a decision, create a runbook, or build a technical wiki for their project.
---

# Knowledge Base Builder

This skill helps you build and maintain a living technical knowledge base for your project — covering architectural decisions, operational runbooks, and coding conventions.

## When to Activate
- User says "document this decision", "create an ADR", "write a runbook for X", "record our conventions"
- After a major refactoring or architecture change
- When onboarding a new team member (create getting started guides)

## Documents You Can Create

### 1. Architectural Decision Record (ADR)
File: `docs/adr/ADR-NNN-title.md`

Structure:
- **Context**: What problem were we facing?
- **Decision**: What did we decide to do?
- **Rationale**: Why this option over alternatives?
- **Consequences**: Trade-offs and downstream effects.
- **Status**: Proposed / Accepted / Deprecated / Superseded

### 2. Runbook
File: `docs/runbooks/runbook-name.md`

Structure:
- **Purpose**: What situation this runbook addresses
- **Prerequisites**: What you need before running
- **Steps**: Numbered, copy-paste-ready commands
- **Expected Output**: What success looks like
- **Troubleshooting**: Common failures and fixes

### 3. PROJECT_CONTEXT.md Update
When new conventions or patterns are established:
1. Read the existing `PROJECT_CONTEXT.md`
2. Append or update the relevant section
3. Confirm with the user before saving

### 4. CONVENTIONS.md
File: `CONVENTIONS.md` in workspace root
- Code style rules
- Git commit message format
- Branch naming strategy
- PR review checklist
- Release process

## Best Practices
- Write for a new team member who has never seen this codebase
- Include concrete examples, not just abstract rules
- Update documentation as part of every PR, not as an afterthought
- Link ADRs to the code they affect with inline comments: `// See: docs/adr/ADR-007-auth-strategy.md`
