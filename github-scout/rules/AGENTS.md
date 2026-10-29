# GitHub & Open-Source Collaboration Rules

Whenever interacting with GitHub, searching open-source software, or analyzing repositories, adhere to the following principles:

## 1. Proactive Open-Source Discovery
- Before designing complex architectures or implementing common utilities from scratch, search GitHub for established open-source libraries, reference templates, and industry standards.
- Prefer well-maintained, battle-tested solutions with high community adoption over unmaintained or abandoned forks.

## 2. Health & Vitality Assessment
When recommending or inspecting an open-source repository:
- **Maintenance Status**: Inspect `pushed_at`, `updated_at`, and the latest release date. A repository with no activity for 2+ years may have unpatched vulnerabilities or outdated dependencies.
- **Community Adoption**: Check `stars`, `forks`, and open vs. closed issues.
- **Documentation**: Verify whether the repository provides a clear `README.md`, setup instructions, and architecture overview.

## 3. License & Compliance Integrity
- Always verify the repository's license (`MIT`, `Apache-2.0`, `BSD-3-Clause`, `MPL-2.0`, `GPL-3.0`, etc.).
- Explicitly advise the user if an open-source project uses copyleft licenses (e.g. GPL, AGPL) if they are developing commercial or proprietary systems.
- Provide proper attribution and direct links (`https://github.com/owner/repo`) when referencing open-source code.

## 4. Code Inspection & Architectural Analysis
- Use `get_readme` first to grasp the high-level purpose and architecture.
- Use `list_directory` to explore the directory structure before reading deep source files.
- Use `get_file_contents` to read targeted source files (e.g., config files, entrypoints, interfaces) rather than fetching arbitrary large files.

## 5. Improving Open-Source Projects
- When asked to improve an open-source repository:
  1. Respect the existing codebase's coding style, naming conventions, and linting rules.
  2. Preserve all existing comments and documentation unless correcting inaccurate statements.
  3. Include unit tests or test plans verifying any proposed bug fix or optimization.
  4. Prepare structured pull request (PR) descriptions explaining: "What changed", "Why it changed", and "How it was verified".

## 6. Proactive Project Preservation & GitHub Publication Mandate (طلب الحفظ على GitHub)
- **Mandatory Completion Protocol**: Whenever the creation, scaffolding, or enhancement of a software project, application, script, or tool is completed and verified, the agent **MUST ALWAYS** ask the user if they want to save, commit, and publish the project to GitHub.
- **Interactive Preservation Offer**:
  1. Suggest a repository name, description, and visibility (`public` or `private`).
  2. Automatically generate or verify a secure `.gitignore` (blocking secrets, `.env`, credentials, build artifacts).
  3. Ensure a comprehensive `README.md` is present.
  4. Perform publication either via GitHub REST API or via local `git` / `gh` CLI.
