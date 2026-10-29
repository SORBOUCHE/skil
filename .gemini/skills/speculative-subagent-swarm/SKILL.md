---
name: speculative-subagent-swarm
description: Orchestrates parallel non-overlapping subagents with isolated workspaces for simultaneous full-stack feature development.
---

# Speculative Subagent Swarm Skill

## Overview
The `speculative-subagent-swarm` skill transforms monolithic sequential execution into a highly concurrent, speculative multi-agent engineering swarm. By decoupling workstreams into strictly isolated write domains and launching autonomous subagents in branched workspaces (`Workspace: 'branch'`), complex multi-layer features can be designed, implemented, tested, and containerized simultaneously.

---

## When to Activate
Activate this skill whenever:
- An epic or project spans at least 2 independent domains (e.g., Backend API + Frontend UI, or Core Logic + E2E Tests + Docker Deployment).
- Accelerating time-to-delivery is critical, and tasks have minimal direct code dependencies.
- Multiple decoupled microservices, modules, or packages need simultaneous upgrades.
- The user requests: "work in parallel", "use multi-agent swarm", or "accelerate execution".

---

## The 4 Principles of Safe Swarm Execution

### 1. Contract-First Decoupling (Step 0)
Before dispatching parallel subagents, the lead agent defines the shared interface or API schema (e.g., OpenAPI 3.1, TypeScript types, or database DDL). This provides an immutable contract so agents can work speculatively without waiting on backend completion.

### 2. Zero-Overlap Write Isolation
Each subagent MUST have an explicitly bounded directory or file set. No two subagents may ever have overlapping write paths:
- **Subagent 1 (Backend):** Writes solely to `src/api/`, `src/models/`
- **Subagent 2 (Frontend):** Writes solely to `src/ui/`, `src/components/`
- **Subagent 3 (QA & Testing):** Writes solely to `tests/e2e/`, `tests/fixtures/`

### 3. Isolated Workspace Mode
Always invoke subagents with `Workspace: 'branch'`:
```json
{
  "TypeName": "self",
  "Role": "Backend API Specialist",
  "Workspace": "branch",
  "Model": "inherit",
  "Prompt": "Implement the API routes in src/api/ according to the contract..."
}
```

### 4. Reactive Rendezvous (Zero Polling)
Antigravity automatically wakes up the lead agent when subagent messages arrive. The lead agent dispatches all subagents in a single turn, calls no more tools, and awaits automated reactive notifications.

---

## Swarm Matrix Validation Tool
Use the built-in validator to ensure zero path collisions before launching:
```bash
node "scripts/swarm-matrix.js" <swarm-manifest.json>
```
If collisions are detected, the tool flags conflicting file paths so the lead agent can adjust boundaries before execution.

---

## Convergence & Verification Phase
When all subagent messages have arrived:
1. Merge and review the isolated branches into the main workspace.
2. Execute the Self-Healing Quad-Check (Compile → Test → Lint → E2E).
3. If any integration regression appears, resolve it surgically via `self-healing-debugger`.
