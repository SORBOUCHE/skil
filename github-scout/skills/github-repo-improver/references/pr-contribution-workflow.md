# Open-Source Contribution Workflow

Follow this standard procedure when planning and submitting contributions to an open-source project:

1. **Check Contributing Guidelines**:
   - Look for `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, or developer setup guides in the repository.
   - Adhere to branch naming conventions (e.g., `fix/issue-123`, `feat/new-feature`).

2. **Check Existing Issues & PRs**:
   - Use `github-scout_search_issues` to ensure someone else hasn't already opened an identical PR or reported that the feature was rejected by maintainers.

3. **Keep Changes Scoped & Focused**:
   - A single PR should address one bug or one feature. Avoid combining unrelated changes or formatting overhauls into a bugfix PR.

4. **Verify Locally**:
   - Run existing linters (`npm run lint`, `flake8`, `cargo clippy`).
   - Run tests (`npm test`, `pytest`, `cargo test`). Ensure 100% of existing tests pass and new tests cover the change.

5. **Write Clean Commit Messages**:
   - Follow Conventional Commits:
     - `feat: add retry mechanism to http client`
     - `fix: resolve race condition in cache invalidation`
     - `docs: update quickstart guide with node 22 example`
