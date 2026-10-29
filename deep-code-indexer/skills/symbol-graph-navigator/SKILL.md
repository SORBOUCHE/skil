---
name: symbol-graph-navigator
description: Navigates massive codebases efficiently using AST symbol graphs, structural file outlines, and targeted lookups without saturating model context.
---

# Symbol Graph Navigator

This skill guides the agent in exploring large enterprise codebases without reading hundreds of files or exhausting the model's context window.

## When to Activate
- Starting work on a project with 20+ files.
- Searching for where a specific function, class, or type is defined.
- Exploring the architecture of unfamiliar large modules.

---

## 3-Step Navigation Protocol

### Step 1: Indexing the Workspace
Run `deep-code-indexer_index_workspace` passing the root directory. This parses all supported files (.ts, .js, .py, .dart, .go, .rs, .java) into local SQLite tables in milliseconds.

### Step 2: Instant Symbol Pinpointing
Instead of guessing file paths or grepping blindly, call `lookup_symbol`:
```json
{
  "name": "AuthService",
  "kind": "class"
}
```
This returns the exact relative path, line number, and signature (e.g. `src/auth/service.ts:24`).

### Step 3: Structural Outline Inspection
To understand what methods `AuthService` provides without reading 500 lines of implementation, call `get_file_outline`:
```json
{
  "file_path": "src/auth/service.ts"
}
```
You get a clean outline of all classes, interfaces, and methods with line numbers. You only read the specific 15 lines you need to modify using `view_file`.
