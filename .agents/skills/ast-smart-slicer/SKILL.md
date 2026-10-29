---
name: ast-smart-slicer
description: Extracts isolated AST nodes, functions, and interfaces from large codebases without loading full file bodies into LLM context.
---

# AST Smart Slicer Skill

## Overview
The `ast-smart-slicer` skill equips the agent with targeted, surgical symbol extraction capabilities. Instead of ingesting entire multi-hundred-line files into the conversation context (which inflates token consumption, wastes KV-cache, and degrades model attention), this skill extracts only the specific function, class, interface, or line slice needed for the current task—along with its immediate dependencies.

---

## When to Activate
Activate this skill whenever:
- Analyzing, modifying, or refactoring code in files larger than 100 lines.
- Performing targeted bug fixes where a stack trace points to a specific function or line number.
- High token efficiency is required to prevent context exhaustion in large projects.
- Extracting interface contracts or data models across multiple files without loading full file bodies.

---

## 3-Tier Slicing Protocol

### Tier 1: Outline & Symbol Discovery (Low Token Overhead)
Before reading lines, discover what exists in the file:
```bash
# Slices symbol outline in JSON (< 150 tokens)
node "scripts/slice.js" <path/to/file> --outline
```
Or use the MCP equivalent:
- `deep-code-indexer_get_file_outline`

### Tier 2: Isolated Symbol Slicing (80%+ Token Savings)
Extract the exact symbol body, its bounds, and its import context:
```bash
node "scripts/slice.js" <path/to/file> --symbol <symbolName>
```
The output provides:
- Exact `startLine` and `endLine`
- Clean `slicedCode` containing only the target function/class
- Relevant `imports` from the file header
- `tokenSavingPercent` (typically 75% to 92% savings)

### Tier 3: Range Slicing
If inspecting a specific region identified by a stack trace or linter:
```bash
node "scripts/slice.js" <path/to/file> --range 45-80
```
Or directly via the native tool:
- `read_file` with `StartLine: 45` and `EndLine: 80`

---

## Surgical Modification Workflow

Once the slice is analyzed:
1. **Never rewrite the entire file** via `write_file` if only one function changed.
2. **Apply targeted edits** via `edit_file`:
   - Set `Target` to the exact lines identified in the slice.
   - Set `Replacement` to the modernized/fixed implementation.
3. Verify the edit with a fast syntax/type check.

---

## Token & Latency Impact
- **Average Token Reduction:** 75% – 90% per file inspection.
- **Context Preservation:** Keeps the agent focused on relevant logic without distraction from unrelated methods.
- **Speed:** Slicing executes in under 20ms using zero-dependency local Node.js.
