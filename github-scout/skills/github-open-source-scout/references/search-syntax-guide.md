# GitHub Search Syntax Quick Reference

## Repository Search Qualifiers

| Qualifier | Example | Description |
| :--- | :--- | :--- |
| `stars:n` | `stars:>500`, `stars:100..500` | Filter by stargazers count |
| `forks:n` | `forks:>50` | Filter by number of forks |
| `language:name` | `language:python`, `language:rust` | Filter by primary programming language |
| `topic:name` | `topic:llm`, `topic:mcp-server` | Filter by repository topic tags |
| `license:key` | `license:mit`, `license:apache-2.0` | Filter by open-source license SPDX ID |
| `created:date` | `created:>2025-01-01` | Created after a specific date |
| `pushed:date` | `pushed:>2026-01-01` | Pushed commits after a specific date |
| `archived:bool` | `archived:false` | Exclude archived/read-only repositories |
| `org:name` | `org:google`, `org:facebook` | Limit to repositories owned by an organization |

## Code Search Qualifiers

| Qualifier | Example | Description |
| :--- | :--- | :--- |
| `repo:owner/name` | `repo:expressjs/express` | Search within a single repository |
| `path:dir` | `path:src/components` | Search within a specific directory |
| `filename:name` | `filename:Dockerfile` | Search files matching a specific filename |
| `extension:ext` | `extension:tsx` | Search files with a specific extension |

## Issues & Pull Requests Qualifiers

| Qualifier | Example | Description |
| :--- | :--- | :--- |
| `is:issue` / `is:pr` | `is:issue`, `is:pr` | Restrict to issues or pull requests |
| `is:open` / `is:closed` | `is:open` | Filter by open/closed status |
| `label:name` | `label:bug`, `label:"help wanted"` | Filter by issue label |
| `comments:>n` | `comments:>10` | Filter by discussion activity |
