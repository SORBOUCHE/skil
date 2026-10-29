# Open-Source Code Audit Checklist

Use this checklist when auditing an open-source codebase for potential improvements:

## 1. Code Quality & Maintainability
- [ ] Are variables and functions descriptively and consistently named?
- [ ] Are complex algorithms accompanied by clear explanatory comments?
- [ ] Is there dead or unreachable code that should be pruned?
- [ ] Are functions short, cohesive, and adhering to single responsibility?

## 2. Performance & Efficiency
- [ ] Are there unnecessary database queries, redundant network calls, or N+1 patterns?
- [ ] Are big data collections filtered early before expensive mappings?
- [ ] Are resources (file handles, database connections, streams) properly closed or released?

## 3. Robustness & Error Handling
- [ ] Are external inputs and API responses validated (e.g. schema validation)?
- [ ] Are promise rejections and async errors handled gracefully?
- [ ] Are edge cases (null, undefined, empty lists, large payloads) tested?

## 4. Testing & Documentation
- [ ] Are core functions covered by unit tests?
- [ ] Are instructions in `README.md` accurate and up to date?
- [ ] Is type information (TypeScript types, Python type hints) complete and strict?
