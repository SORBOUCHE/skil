---
name: real-machine-verifier
description: Executes, monitors, benchmarks, and debugs real-world applications directly on the host Windows machine after virtual simulation to discover actual runtime errors without guesswork.
---

# Real-Machine Verifier & Bare-Metal Diagnostic Engine

## Overview
The `real-machine-verifier` skill eliminates speculative guessing and theoretical assumptions. Whenever an application, script, API, or GUI tool is built or modified, this skill executes the program natively on the real Windows machine, measuring actual RAM WorkingSet, CPU utilization, exit codes, open TCP ports, HTTP 200 responsiveness, and Windows Event Viewer Application Crashes (Event ID 1000).

---

## When to Activate
- **Automatically with every build or code modification:** After static analysis or unit tests pass, immediately run the real process on the host machine to confirm real runtime health.
- When the user asks: "جرب البرنامج على الحاسوب الحقيقي", "شغل الأداة وتأكد منها بدون تخمين", "افحص الخطأ الحقيقي في ويندوز", or invokes `/real-test` or `/live-test`.
- Whenever a program crashes silently, exits unexpectedly, or fails to open a GUI window.

---

## Two-Phase Verification Protocol

```
[ Phase 1: Virtual Verification ]
  └── Linting, Type Checking, and Unit Tests pass cleanly.
           │
           ▼
[ Phase 2: Real-Machine Execution (Bare-Metal) ]
  ├── 1. Run live process via `run_live_process` tool.
  │      └── Measures PID, Duration, Peak Memory (RAM MB), CPU, exit code.
  ├── 2. For servers & APIs: probe port via `probe_real_port`.
  │      └── Verifies port listening on 127.0.0.1 and HTTP status 200.
  ├── 3. For abnormal exits: inspect `read_system_crash_logs`.
  │      └── Scans Event Viewer for Faulting Module (.dll) and Exception Code.
  └── 4. Self-Healing Loop:
         └── If failure detected, patch surgically and re-run on host until 100% stable.
           │
           ▼
[ Phase 3: Final Visible Verification ]
  └── When development is 100% complete and fully verified silently, launch
      `open_test_cmd_window` so the user sees the real working program on their screen.
```

---

## Tool Reference

### 1. `run_live_process`
Executes the command natively on Windows:
```json
{
  "command": "python app.py",
  "cwd": "e:\\my_project",
  "timeout_seconds": 30,
  "is_daemon": false
}
```
Returns: `status` (`SUCCESS`, `FAILED`, `CRASHED`, `TIMEOUT`), `exit_code`, `peak_memory_mb`, `duration_seconds`, `stdout`, `stderr`.

### 2. `probe_real_port`
Probes local listening TCP ports and tests HTTP responsiveness:
```json
{
  "port": 8000,
  "path": "/api/health",
  "timeout_ms": 3000
}
```
Returns: `port_open` (true/false), `http_accessible`, `status_code`, `headers`, `body_preview`.

### 3. `read_system_crash_logs`
Scans Windows Event Viewer for native Application Error (Event ID 1000):
```json
{
  "minutes_back": 15,
  "app_name_filter": "python.exe"
}
```
Returns: Exact faulting application, faulting module (.dll/.exe), and exception code (e.g. `0xc0000005` Access Violation).

### 4. `open_test_cmd_window`
Opens a styled interactive CMD window (`cmd.exe /k`) on the user's desktop:
```json
{
  "command": "python main.py",
  "title": "My Application Live Test"
}
```
Strict Rule: Use only when development is 100% finished. Intermediate tests must remain silent with zero window popups.
