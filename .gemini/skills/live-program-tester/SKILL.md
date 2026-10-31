---
name: live-program-tester
description: Executes, monitors, benchmarks, and debugs real-world applications directly on the host Windows machine with deep error diagnostics.
---

# Live Program Tester & Deep Error Diagnostics Skill (مختبر البرامج الحية ومستكشف الأخطاء)

## Overview
The `live-program-tester` skill grants Antigravity the capability to execute, stress-test, and observe real applications (Node.js, Python, C++, Go, Rust, Web servers, Batch scripts, and Desktop utilities) directly on the physical host machine. It captures all operational details: standard output, standard error, exit codes, process CPU/RAM metrics, listening network ports, HTTP endpoint responsiveness, and Windows Event Viewer crash records.

---

## When to Activate
Activate this skill whenever:
- The user requests: "جرب البرنامج على الحاسوب", "شغل الأداة وتأكد من عملها", "افحص الخطأ في الحاسوب", "test program on real PC", or invokes `/test-program` or `/live-test`.
- A newly built application, API, script, or tool needs real-world functional verification before delivery.
- A program crashes mysteriously or fails silently on the host machine and requires deep OS-level diagnostic inspection.
- A local web service or backend API needs port discovery and endpoint health verification.

---

## Deep Diagnostics Architecture

```
[ User / Agent Request: Run & Test Program ]
                     │
                     ▼
  1. Process Execution & Telemetry (live_tester.py)
     ├── Captures real-time stdout, stderr, and exit codes.
     ├── Tracks PID, Peak RAM (MB), CPU %, and thread counts via psutil.
     └── Detects listening TCP ports (e.g. 3000, 8000, 5000).
                     │
                     ▼
  2. Multi-Tier Health Verification
     ├── CLI Mode: Verifies zero exit code and expected outputs.
     ├── Server Mode: Probes HTTP localhost endpoint (Status 200, latency, HTML preview).
     └── Web UI Mode: Uses Playwright to render and audit the web interface.
                     │
                     ▼
  3. Windows OS-Level Crash Triage (Event ID 1000)
     └── If abnormal termination occurs, inspects Windows Event Log
         for Faulting Module (.dll/.exe), Exception Code (e.g. 0xc0000005), and memory offset.
                     │
                     ▼
  4. Automated Remediation Loop (Self-Healing Debugger)
     └── Feeds diagnostic failure report directly into `self-healing-debugger`
         and patches issues surgically using `ast-smart-slicer`.
```

---

## How to Use the Diagnostic Engine

### 1. Testing Standard CLI Applications & Scripts
Run a command and monitor execution vitals:
```bash
python ".agents/skills/live-program-tester/scripts/live_tester.py" --cmd "<command_string>"
```
*Example:*
```bash
python ".agents/skills/live-program-tester/scripts/live_tester.py" --cmd "python main.py" --timeout 15
```

### 2. Testing Web Servers & Background Services (`--daemon`)
Starts the server, tracks its port, and probes `http://127.0.0.1:<port>/`:
```bash
python ".agents/skills/live-program-tester/scripts/live_tester.py" --cmd "python -m uvicorn app:app --port 8000" --daemon --timeout 8
```

### 3. Extracting Raw JSON Diagnostic Reports (`--json`)
For programmatic ingestion into automated test pipelines:
```bash
python ".agents/skills/live-program-tester/scripts/live_tester.py" --cmd "npm test" --json
```

---

## Diagnostic Report Elements

Every test produces a comprehensive audit containing:
1. **Status**: `SUCCESS`, `FAILED`, `CRASHED`, `TIMEOUT`, or `DAEMON_HEALTHY`.
2. **Process Metrics**: Duration (seconds), Peak RAM in MB, Peak CPU %.
3. **Stream Outputs**: Full captured `stdout` and `stderr`.
4. **Port Probes**: Automatic HTTP response status code, reason, and body preview.
5. **Windows Event Log**: Exact details of any crash registered in Windows Event Viewer (Faulting application, Faulting module, Exception Code).

---

## Autonomous Self-Healing Integration
When `status` is `FAILED` or `CRASHED`:
1. **Analyze the Root Cause**: Extract the traceback from `stderr` or the faulting DLL from the Windows Event Log.
2. **Locate the Faulting Code**: Use `deep-code-indexer` and `ast-smart-slicer` to locate the offending function.
3. **Apply Minimal Fix**: Use `edit_file` to resolve the defect.
4. **Re-Test Immediately**: Re-run `live_tester.py` to confirm that the fix passes cleanly on the real machine.
