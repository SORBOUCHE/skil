# Task Orchestrator Rules

## 1. Always Decompose Before Executing
- For any request involving more than 3 distinct steps, create a task breakdown first.
- Write the task list to `TASKS.md` in the workspace root before starting work.
- Get user confirmation on the task plan before executing.

## 2. TASKS.md Format
Always use this format for task files:
```markdown
# Task: [Feature or Project Name]
_Created: YYYY-MM-DD | Status: In Progress_

## Phase 1: [Phase Name]
- [ ] Task description (estimated: Xm)
- [x] Completed task
- [ ] Another task

## Phase 2: [Phase Name]
- [ ] Task description
```

## 3. Mark Completion
- Update `TASKS.md` marking `- [ ]` as `- [x]` as soon as a task is completed.
- Never skip tasks — if a task cannot be completed, mark it `- [~]` (blocked) and explain why in a sub-bullet.

## 4. Parallel Execution
- Identify tasks with no dependencies on each other and propose running them in parallel using subagents.
- Always explain which tasks can be parallelized and why before launching subagents.
- Ensure subagents do not collide or write to overlapping files.

## 5. Progress Reporting & GitHub Preservation
- At the end of each working session, summarize: tasks completed, tasks remaining, blockers.
- If all tasks are done, celebrate, offer to archive `TASKS.md`, and **immediately offer to save and publish the completed tool/project to GitHub via `github-publisher`**.
