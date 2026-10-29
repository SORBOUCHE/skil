---
name: impact-analysis-specialist
description: Pre-refactoring dependency impact analysis. Traces symbol references and import graphs to prevent breaking changes across multi-file codebases.
---

# Impact Analysis Specialist

This skill guides the agent in assessing the blast radius of any code change before making edits in multi-file projects.

## When to Activate
- Renaming an exported function, class, or type.
- Changing function arguments or return types.
- Deleting or deprecating a shared module.

---

## 4-Step Blast Radius Assessment

### Step 1: Query Dependency Graph
Call `analyze_symbol_impact` with the target symbol name (e.g. `UserDTO`):
```json
{
  "symbol_name": "UserDTO"
}
```

### Step 2: Review Impacted Callers
The tool returns:
- All definitions across the codebase.
- All files that import this symbol via `file_dependencies`.

### Step 3: Classify Risk Level
- **Zero Risk (Local Symbol)**: Impacted files count = 0. Safe to edit immediately.
- **Moderate Risk (1-3 Files)**: Callers can be updated in the same atomic turn.
- **High Risk (10+ Files / Shared Library)**: Introduce an adapter shim or keep legacy signature with deprecation tag to avoid breaking callers.

### Step 4: Synchronized Multi-File Patching
Update the definition and all dependent caller files in lockstep, verifying with the project's linter or test runner.
