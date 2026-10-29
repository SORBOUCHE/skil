---
name: github-open-source-scout
description: Discover, analyze, and benchmark open-source GitHub repositories matching the user's project requirements. Use when searching for open-source alternatives, reference implementations, libraries, architectural patterns, or starter boilerplates on GitHub.
---

# GitHub Open-Source Scout

This skill guides the agent in searching GitHub for open-source repositories, evaluating relevant software, extracting architectural patterns, and adopting best practices for whatever the user is building.

## When to Activate This Skill
- The user is starting a new project and needs reference architectures, libraries, or boilerplates.
- The user asks: "What open-source projects exist for X?", "Find a GitHub library that does Y", or "How do other projects implement Z?".
- The user wants to compare multiple open-source alternatives (e.g. comparing ORMs, auth systems, or agent frameworks).
- The user wants to inspect how an established open-source repository structures its codebase or solves a specific technical challenge.

---

## Workflow: From Query to Architecture

```
[1. Requirement Analysis] -> [2. High-Signal Search] -> [3. Filter & Rank] -> [4. Deep Inspection] -> [5. Synthesis & Adoption]
```

### Step 1: Formulate High-Signal Search Queries
Do not use vague single-word queries. Construct queries that filter by language, stars, and topics:
- **By Domain & Language**: `query: "semantic search language:python stars:>200"`
- **By Topic & Category**: `query: "topic:agent topic:gemini stars:>50"`
- **By Framework/Stack**: `query: "rag fastapi langchain stars:>100"`
- **Sort Strategically**:
  - For battle-tested industry standards: `sort: "stars"`
  - For modern cutting-edge developments: `sort: "updated"`

Call `github-scout_search_repositories` with your constructed query.

### Step 2: Compare & Rank Candidates
When presenting candidates to the user, produce an evaluation table comparing:
1. **Repository Name & URL**: Owner/repo and clickable markdown link.
2. **Stars & Vitality**: Star count, recent commit activity (`updated_at`).
3. **License**: Permissive (`MIT`, `Apache-2.0`, `BSD`) vs Copyleft (`GPL`, `AGPL`).
4. **Core Tech Stack**: Frameworks, languages, dependencies.
5. **Key Advantages**: What makes this project suitable for the user's need.

### Step 3: Deep Dive into Selected Repository
Once top candidates are identified:
1. **Read README**:
   Call `github-scout_get_readme` to understand architecture, installation, features, and design goals.
2. **Explore Project Layout**:
   Call `github-scout_list_directory` on root (`path: ""`) and core folders (e.g. `src/`, `lib/`, `packages/`).
3. **Inspect Dependency Manifest**:
   Call `github-scout_get_file_contents` on `package.json`, `pyproject.toml`, `go.mod`, or `Cargo.toml` to see actual dependencies and build configurations.
4. **Inspect Core Implementation**:
   Use `github-scout_get_file_contents` to read entrypoints and key modules, extracting clean architectural patterns.

### Step 4: Local Workspace Download (Optional)
If the user wants to test, modify, or run the open-source project locally:
- Call `github-scout_download_repository` specifying `owner`, `repo`, and the target `destination_path` within the workspace.

---

## Best Practices
- **Never blindly copy code**: Always adapt patterns to match the user's project conventions and language standards.
- **Verify Licenses**: Ensure the open-source license allows the user's intended use (especially for commercial applications).
- **Check Issue Tracker**: Call `github-scout_search_issues` (`repo:owner/repo is:issue is:open`) to see if the library suffers from critical bugs or memory leaks before recommending it.
