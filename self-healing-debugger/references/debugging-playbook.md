# Self-Healing Debugger Playbook — Step-by-Step Triage Workflow

An operational step-by-step triage workflow for diagnosing software defects, isolating failing states, engineering verified surgical patches, and preventing regressions.

---

## Triage Phase Overview

```
 [Trigger: Error/Crash/Test Failure]
                 │
                 ▼
 ┌────────────────────────────────┐
 │ Level 1: Triage & Classification│  Extract stack trace, classify severity & category
 └────────────────────────────────┘
                 │
                 ▼
 ┌────────────────────────────────┐
 │ Level 2: Isolation & Reproduce │  Write minimal test reproducing defect in isolation
 └────────────────────────────────┘
                 │
                 ▼
 ┌────────────────────────────────┐
 │ Level 3: Root-Cause Analysis   │  Identify invariant breach, track data provenance
 └────────────────────────────────┘
                 │
                 ▼
 ┌────────────────────────────────┐
 │ Level 4: Surgical Patching     │  Formulate minimal diff, no speculative refactors
 └────────────────────────────────┘
                 │
                 ▼
 ┌────────────────────────────────┐
 │ Level 5: Automated Verification│  Target test PASS -> Full test suite PASS -> Lint PASS
 └────────────────────────────────┘
                 │
                 ▼
 [Resolution & Audit Report]
```

---

## Level 1: Triage & Classification

1. **Capture Diagnostic Artifacts:**
   - Command line invoked.
   - Exit code.
   - Full stderr output, stripping ANSI formatting.
   - Operating system and runtime versions.

2. **Error Pattern Classification:**
   - **Syntax / Build Error:** Missing imports, typos, TypeScript compiler errors.
   - **Runtime Crash:** Nil dereference, unhandled rejection, panic, out of bounds.
   - **Assertion Failure:** Contract breach, output mismatch, business logic failure.
   - **Concurrency / Race:** Flaky failure under load, lock contention, race condition.
   - **Resource Exhaustion:** Memory leak, socket exhaustion, file handle starvation.

3. **Severity Assessment:**
   - **P0 (Critical):** Application fails to boot or unhandled panic crashes worker thread.
   - **P1 (High):** Specific endpoint/route or feature crashes consistently.
   - **P2 (Medium):** Edge case failure or validation error returning 500 instead of 400.
   - **P3 (Low):** Deprecation warning or minor formatting anomaly.

---

## Level 2: Isolation & Reproduction

1. **Isolate the Failure Path:**
   - Determine which function and arguments triggered the defect.
   - Eliminate external network or database dependencies by using existing mock structures or local fixtures.

2. **Construct Minimal Reproducer:**
   - Add a targeted test case to the existing test suite:
     - Name pattern: `it('should handle <scenario> without crashing', () => { ... })`
     - Keep reproducer under 20 lines.
   - Run only that targeted reproducer to confirm failure (**RED**):
     ```powershell
     npm test -- -t "reproducer name"
     # or
     pytest -k "test_reproducer_name"
     ```

---

## Level 3: Root-Cause Analysis (RCA)

1. **Locate Originating Source Line:**
   - Trace the stack frames from bottom to top (or top to bottom depending on runtime).
   - Find the first non-vendor, non-framework source line.

2. **Inspect Variable State & Contract:**
   - What value was passed? (e.g., `null`, `undefined`, empty string, unexpected enum).
   - Why was this value provided by the caller?
   - Was input validation bypassed?

3. **Distinguish Root Cause from Symptom:**
   - *Symptom:* `Cannot read property 'name' of undefined` in `renderGreeting(user)`.
   - *Root Cause:* Session deserializer returned `undefined` when user profile was deleted in database.

---

## Level 4: Surgical Patching

1. **Formulate Minimal AST Modification:**
   - Restrict edits strictly to the affected logic path.
   - Do not reformat adjacent lines or refactor unrelated functions.
   - Guard against invalid values:
     - Add explicit schema validation or guard clause.
     - Provide sensible typed defaults.
     - Throw clear domain-specific errors if state is irrecoverable.

2. **Apply Rules Check:**
   - [ ] No empty `catch` or `except` blocks.
   - [ ] No weakened test assertions.
   - [ ] Minimal diff footprint.
   - [ ] Preserved public API signatures.

---

## Level 5: Automated Verification

1. **Execute Target Reproducer:**
   - Re-run the reproducer test created in Level 2.
   - Confirm it transitions from **RED** to **GREEN**.

2. **Execute Full Test Suite:**
   - Run the full test suite to guarantee zero regressions:
     ```powershell
     npm test
     pytest
     go test ./...
     cargo test
     ```

3. **Execute Static Analysis & Linter:**
   - Run compiler and linter:
     ```powershell
     npm run lint
     npx tsc --noEmit
     ```

4. **Verify Clean Git Diff:**
   - Inspect `git diff` to ensure no accidental debug print statements or unintended whitespace modifications were left behind.

---

## Resolution Report Template

When closing an issue or reporting back to the user, format the summary using this structure:

```markdown
### 🛠️ Self-Healing Diagnostic Report

- **Incident:** `TypeError: Cannot read properties of undefined (reading 'token')`
- **Crashing Location:** `src/auth/session.ts:42:18`
- **Root Cause:** Session payload lacked `token` when OAuth refresh expired.
- **Surgical Patch:** Added token validation guard and refreshed expired session before dereferencing.
- **Verification:**
  - ✅ Target test `should renew session on expired token` passed.
  - ✅ Full test suite passed (42/42 tests).
  - ✅ Typecheck & lint passed cleanly with zero errors.
- **Files Modified:**
  - `src/auth/session.ts` (3 lines changed)
  - `tests/auth/session.test.ts` (1 regression test added)
```
