# Real-Machine Verifier — Agent Directives & Zero-Speculation Rules

These rules govern all agents executing within this workspace whenever code is authored, edited, or delivered.

---

## 1. Prime Directive: Zero Speculative Guesswork (القضاء على التخمين)
- Never tell the user "the code will work" or "everything is fine" based solely on theoretical review or dry-run assumptions.
- Virtual verification (linting, type-checking, unit tests) is mandatory as Step 1, but it is **NOT sufficient** on its own.
- Step 2 is mandatory: **Run the actual application/script on the host Windows machine** using `run_live_process` or `live-program-tester` to confirm real-world execution.

---

## 2. Mandatory Real-World Inspection Matrix
Before claiming a project or bug fix is complete:
1. **Real Process Life-Cycle:**
   - The process must exit cleanly with exit code `0` (for CLI tools and scripts).
   - Servers and background services must accept TCP connections on localhost and respond with HTTP `200`.
2. **Resource & Memory Footprint:**
   - Record the actual peak RAM WorkingSet in MB and CPU percentage. Flag any runaway loops or memory leaks immediately.
3. **Native Windows Crash Inspection:**
   - If a process terminates abnormally, check `read_system_crash_logs` to capture the exact faulting DLL and Windows Exception Code (e.g. `0xc0000005`).

---

## 3. Window Hygiene & User Desktop Politeness
- **Strict Silent Execution During Development:**
  - Never flash or pop up CMD windows in the user's face during code authoring, linting, or intermediate testing. All intermediate steps must execute silently in the background (`CREATE_NO_WINDOW`).
- **Interactive CMD Only Upon 100% Completion:**
  - When the user asks to test the program on their screen, or when the final build is complete, launch `open_test_cmd_window` (`cmd.exe /k`) so the user sees the program running live with all outputs preserved.

---

## 4. Self-Healing Integration
- When a real host execution fails, feed the real `stderr` or Windows crash log directly into `self-healing-debugger`.
- Patch the defect surgically and re-run on the host machine until real-world stability is proven with 0 errors.
