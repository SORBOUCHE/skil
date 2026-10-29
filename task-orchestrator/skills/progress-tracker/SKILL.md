---
name: progress-tracker
description: Monitors task velocity against TASKS.md, tracks progress metrics, suggests next actions, and manages blockers and archiving.
---

# Progress Tracker Skill

## Overview
The `progress-tracker` skill monitors, audits, and guides task execution against `TASKS.md`. It tracks overall milestone velocity, calculates accurate completion metrics, recommends the next sequential action, resolves blockers, and archives completed epics.

---

## When to Activate
Activate this skill whenever:
- The user asks: "What should we do next?", "Where did we leave off?", "Check progress", or "Give me a status update".
- A task has just finished execution and `TASKS.md` must be updated.
- A new session begins with an existing `TASKS.md` or `TODO.md` in the workspace.
- A task encounters a blocking issue, missing dependency, or technical obstacle.
- All tasks in an epic have reached completion and cleanup/archiving is needed.

---

## How to Read and Parse TASKS.md

### 1. File Discovery
Locate the primary task manifest in priority order:
1. `<workspaceRoot>/TASKS.md`
2. `<workspaceRoot>/.agents/TASKS.md`
3. `<workspaceRoot>/TODO.md`

### 2. State Token Parsing
Parse Markdown checkbox markers across each line:
- `- [x]` or `- [X]`: **Completed**
- `- [ ]`: **Pending**
- `- [~]` or `- [-]`: **Blocked / In Progress**
- Lines starting with `##` or `###`: **Phase / Milestone Headers**
- Sub-bullet lines (`  - reason`): **Blocker annotations or notes**

---

## Metric Calculation & Progress Math

Calculate project health using standard formulas:
- **Total Tasks ($N_{total}$)**: Count of all `[ ]`, `[x]`, and `[~]` items.
- **Completed Tasks ($N_{done}$)**: Count of `[x]` items.
- **Pending Tasks ($N_{pending}$)**: Count of `[ ]` items.
- **Blocked Tasks ($N_{blocked}$)**: Count of `[~]` items.
- **Completion Percentage**:
  $$\text{Progress} = \left(\frac{N_{done}}{N_{total}}\right) \times 100\%$$
- **Phase-by-Phase Progress**: Compute percentage independently for each `## Phase` section to identify bottlenecks.

---

## Identifying the Next Logical Task

Follow this algorithmic decision tree:
1. **Check for In-Progress Tasks**: If any task is marked as in-progress or partially touched, resume it first.
2. **Scan Top-to-Bottom**: Find the first `- [ ]` task in the earliest incomplete phase.
3. **Verify Dependencies**:
   - Check if the task specifies `(depends on: #X.Y)`.
   - If `#X.Y` is `- [ ]` or `- [~]`, do NOT start. Skip to the next unblocked candidate or resolve dependency.
4. **Identify Parallel Branches**:
   - If multiple tasks in the current phase are unblocked and flagged `[PARALLEL-CANDIDATE]`, propose parallel execution to the user or dispatch subagents.
5. **State Intent to the User**:
   - Announce: *"Next up is Task X.Y: `<description>`. Proceeding with implementation..."*

---

## Handling Blocked Tasks (`- [~]`)

When an obstacle prevents task completion:
1. **Tag as Blocked**: Change `- [ ]` to `- [~]`.
2. **Add Blocker Reason**: Immediately append a child bullet explaining the root cause:
   ```markdown
   - [~] Task 3.2: Integrate Stripe payments
     - BLOCKED: Stripe test secret key missing in .env
     - Action needed: Provide STRIPE_SECRET_KEY in .env or run stripe mock CLI
   ```
3. **Notify User**: Clearly describe what is needed to unblock (credentials, clarification, design decision).
4. **Pivot to Non-Blocked Task**: If other independent tasks exist, advance them rather than stalling the session.

---

## When to Suggest Replanning vs. Continuing

### Continue Working When:
- Planned tasks remain technically valid and dependencies are satisfied.
- Minor errors occur that can be fixed within the current task scope.
- Velocity is steady and no structural requirement changes have been introduced.

### Suggest Replanning When:
- 2 or more consecutive tasks encounter architectural blockers or breaking dependency conflicts.
- User introduces new requirements that invalidate downstream phases.
- Estimated task size significantly exceeded (e.g., an `S` task turned into an `XL` rabbit hole).
- The current implementation model proves incompatible with constraints discovered mid-flight.

---

## Stakeholder Progress Reporting Format

When prompted for a progress update, output a structured report:

```markdown
### 📊 Project Status: [Project Name]
**Progress:** 65% completed (13 / 20 tasks done)
**Current Phase:** Phase 3: Core API Endpoints

#### ✅ Completed Recently
- [x] Task 3.1: User authentication middleware and JWT verification
- [x] Task 3.2: User profile CRUD endpoints with Zod schema validation

#### 🚀 In Progress / Up Next
- [ ] Task 3.3: Organization member invitation workflow [M - 1h]
- [ ] Task 3.4: Role-based access control (RBAC) guards [M - 1h]

#### ⚠️ Blockers & Risks
- None currently. All dependencies satisfied.
```

---

## Archiving Completed Projects

When all tasks reach `- [x]`:
1. Ask the user: *"All tasks are complete! Would you like me to archive `TASKS.md` to `.agents/history/TASKS-YYYYMMDD-HHMM.md`?"*
2. If confirmed:
   - Create `.agents/history/` directory if missing.
   - Copy `TASKS.md` to `.agents/history/TASKS-<timestamp>.md`.
   - Update the top header of the archived file with:
     `_Completed on: YYYY-MM-DD HH:MM | Status: 100% Complete_`
   - Reset or clean `TASKS.md` for the next epic.
