---
name: github-repo-improver
description: Audit, optimize, and improve open-source GitHub repositories. Use when analyzing code quality, identifying performance bottlenecks, adding unit tests, fixing bugs, and preparing pull requests (PRs) or contribution proposals.
---

# GitHub Repo Improver

This skill guides the agent in conducting deep audits of open-source projects, identifying areas for improvement, generating fixes, and crafting professional pull requests (PRs) or contribution proposals.

## When to Activate This Skill
- The user points to an open-source GitHub repository and asks: "How can I improve this repo?", "Find bugs in this project", or "Optimize this code".
- The user wants to contribute a bugfix, documentation update, or new feature to an open-source project.
- The user downloaded an open-source codebase and wants to modernize, refactor, or harden it for their own production use.

---

## 4-Step Contribution & Improvement Journey

```
[1. Repository Audit] -> [2. Solution Design & Implementation] -> [3. Verification & Testing] -> [4. Draft PR / Proposal]
```

### Step 1: Systematic Codebase Audit
1. **Explore Repo Architecture**:
   - Call `github-scout_list_directory` to understand file distribution.
   - Read build scripts, lint configs (`eslint`, `biome`, `ruff`, `tsconfig.json`).
2. **Review Open Issues**:
   - Call `github-scout_search_issues` (`repo:owner/repo is:issue is:open label:"good first issue"` or `label:bug`) to inspect current pain points reported by users.
3. **Audit Targeted Modules**:
   - Call `github-scout_get_file_contents` to read core logic.
   - Check for:
     - Edge cases and uncaught exceptions.
     - Inefficient loops, duplicate calculations, or memory leaks.
     - Missing input validations or security vulnerabilities.
     - Lack of test coverage or incomplete documentation.

### Step 2: Implement High-Quality Enhancements
- **Preserve Existing Style**: Follow the project's formatting, naming style, and conventions strictly.
- **Minimal Invasive Changes**: Focus changes strictly on the target improvement. Avoid unnecessary mass-reformatting that muddies git diffs.
- **Maintain Backwards Compatibility**: Ensure existing public APIs and function signatures remain functional unless deprecation is explicitly planned.

### Step 3: Write Tests & Verify
- Add unit tests validating the bugfix or new feature (using the project's existing test framework like `pytest`, `jest`, `vitest`, `go test`).
- Ensure all assertions cover boundary conditions and error paths.

### Step 4: Craft the Pull Request Proposal
Draft a pull request description following industry best practices:
```markdown
## Description
<!-- Concise summary of what changed and the motivation behind it -->

## Motivation & Context
<!-- Which issue does this fix? Why is this change necessary? Fixes #123 -->

## Key Changes
- Refactored `...` to eliminate redundant queries.
- Added comprehensive unit tests in `tests/...`.
- Updated README with new configuration flags.

## How Was This Tested?
- [x] Unit tests pass locally.
- [x] Verified edge case with empty payload.
```
