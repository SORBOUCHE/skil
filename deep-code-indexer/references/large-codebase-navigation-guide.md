# Large Codebase Navigation Guide

## Strategies for Handling 100+ File Projects

### 1. The Outline-First Heuristic
When inspecting an unfamiliar module, never dump the whole file. Read its outline first:
1. `deep-code-indexer_get_file_outline` -> View method signatures and line numbers.
2. `view_file` -> Read only lines 45-65 where the specific method is implemented.

### 2. The Impact-Before-Edit Protocol
Always run `deep-code-indexer_analyze_symbol_impact` before modifying any shared symbol.

### 3. Progressive Code Loading
Load files on-demand based on symbol graphs rather than loading entire folders at once.
