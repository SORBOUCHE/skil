# Hierarchical Codebase Memory & Symbol Graph Rules

These rules govern how agents navigate, analyze, and modify large multi-file codebases without saturating model context.

---

## 1. Index Before Deep Navigation
- In projects with more than 10 files, run `deep-code-indexer_index_workspace` to build or refresh the local symbol index.
- Never read 10+ whole files sequentially just to locate a function or class definition. Use `lookup_symbol` first to jump directly to the target file and line.

## 2. Pre-Refactoring Impact Analysis
- Before renaming, modifying parameters, or deleting an exported function/class/interface, call `analyze_symbol_impact`.
- If a symbol is imported across multiple files, plan a synchronized update so callers are not broken.

## 3. Structural File Outlines Over Full Dumps
- When examining an unfamiliar large module (> 200 lines), call `get_file_outline` to grasp its architecture, classes, and exported methods before loading lines into context.

## 4. Modular File Boundary Standard
- Keep files cohesive and focused on a single responsibility.
- When an individual file exceeds 300-400 lines, extract cohesive sub-modules and use the symbol graph to verify import paths.
