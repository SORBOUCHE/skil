---
name: root-cause-analysis
description: Master protocol for deep diagnostic investigations, stack trace decomposition, concurrency triage, memory analysis, and pinpointing exact failure origins.
---

# Root Cause Analysis (RCA) Protocol

## 1. Overview & Core Philosophy

Root Cause Analysis (RCA) in automated software engineering is the disciplined practice of identifying the single fundamental defect or systemic condition that triggered an observable failure cascade. When code crashes, the terminal output or log snippet is almost never the root cause—it is merely the terminal symptom of a state invariant that was violated earlier in the execution graph.

The goal of this skill is to empower the agent to trace backward from symptoms to originating statements, distinguishing downstream collateral damage from upstream source faults.

```
+-------------------------------------------------------------------------------+
|                             The Diagnostic Cascade                            |
|                                                                               |
| [Upstream Invariant Violation]  --> e.g. Config schema omitted API key        |
|               |                                                               |
| [Silent Invalidation State]     --> Client instantiated with undefined url    |
|               |                                                               |
| [Execution Drift]               --> Request sent to undefined:443             |
|               |                                                               |
| [Terminal Symptom]              --> TypeError: Cannot read property 'get' of  |
|                                     undefined at httpClient.js:142            |
+-------------------------------------------------------------------------------+
```

---

## 2. Anatomy of Stack Traces Across Modern Runtimes

Understanding the distinct formatting and execution semantics of runtime stack traces is crucial for fast and accurate attribution.

### 2.1 Node.js / V8 Runtime Stack Traces
V8 prints frames in inverted chronological order (top frame is the failure site):
```text
TypeError: Cannot read properties of undefined (reading 'items')
    at transformOrderData (/app/src/services/order.ts:84:22)
    at processOrders (/app/src/services/order.ts:130:11)
    at runMicrotasks (<anonymous>)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
```
- **Topmost application frame:** `/app/src/services/order.ts:84:22` is where the invalid dereference occurred.
- **Node internals:** `node:internal/...` frames should be filtered out to isolate user-land code.
- **Async context loss:** When promises lack chained error handling or when `await` is missed, the stack trace collapses into `processTicksAndRejections`. To restore async stack traces in Node, inspect `Error.stackTraceLimit` or pass `--trace-warnings` / `--async-stack-traces`.

### 2.2 Python CPython Tracebacks
Python prints tracebacks chronologically (most recent call last; bottom frame is the failure site):
```text
Traceback (most recent call last):
  File "/app/api/routers/billing.py", line 45, in checkout
    invoice = invoice_service.generate(cart)
  File "/app/services/invoice_service.py", line 112, in generate
    subtotal = sum(item.price * item.quantity for item in cart.items)
AttributeError: 'NoneType' object has no attribute 'items'
```
- **Originating symptom:** Line 112 in `invoice_service.py`.
- **True root cause:** In line 45 of `billing.py`, `cart` was passed as `None` or contained an empty payload without upstream validation.

### 2.3 Go Panics and Goroutine Dumps
Go outputs all active goroutines upon an unrecovered `panic`:
```text
panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: code=0x1 addr=0x18 pc=0x104b2a84]

goroutine 42 [running]:
github.com/org/repo/pkg/worker.(*BatchProcessor).Process(0x140001a4000, {0x1400012e060, 0x5, 0x8})
	/app/pkg/worker/processor.go:73 +0x1a4
github.com/org/repo/pkg/worker.StartWorkers.func1()
	/app/pkg/worker/worker_pool.go:38 +0x68
created by github.com/org/repo/pkg/worker.StartWorkers in goroutine 1
	/app/pkg/worker/worker_pool.go:34 +0x12c
```
- **Goroutine identifier:** `goroutine 42 [running]` is the crashing thread. Other goroutines may be waiting on channels or locks.
- **Nil Pointer:** Offset `0x18` indicates reading a struct field from a nil pointer receiver or struct reference.

### 2.4 Rust Panics & Backtraces
Rust displays panics with optional backtraces (`RUST_BACKTRACE=1`):
```text
thread 'tokio-runtime-worker' panicked at 'called `Option::unwrap()` on a `None` value', src/handlers/auth.rs:59:34
stack backtrace:
   0: rust_begin_unwind
   1: core::panicking::panic_fmt
   2: core::panicking::panic
   3: core::option::Option<T>::unwrap
   4: my_app::handlers::auth::verify_jwt
             at ./src/handlers/auth.rs:59:34
```
- **Unwrap / Expect:** Look immediately for explicit unwrap points on empty `Option` or `Result::Err`.

### 2.5 Dart / Flutter Stack Traces
```text
Unhandled exception:
LateInitializationError: Field '_userProfile@4123512' has not been initialized.
#0      ProfileScreenState._userProfile (package:app/features/profile/screen.dart)
#1      ProfileScreenState.build (package:app/features/profile/screen.dart:94:21)
```
- **Late Initialization:** Accessing non-nullable `late` fields prior to async resolution in `initState()` or state binding.

---

## 3. Diagnostic Classification Matrix

### Category A: Nil/Null Dereferences & Type Mismatches
- **Mechanism:** Operating on `undefined`, `null`, `None`, or an unexpected type.
- **Root Cause Indicators:** Missing null checks, optional chaining omission, API payload contract change, or unhandled null return from a lookup/find query.
- **Action:** Inspect the calling site to confirm why the value was not provided, then implement type guards or proper fallback defaults.

### Category B: Unhandled Promise Rejections & Async Execution Drift
- **Mechanism:** An error thrown inside an async worker or promise executor without a corresponding `.catch()` or `try/catch` block.
- **Root Cause Indicators:** Floating promises (unawaited `async` calls), unhandled event emitter error events, or promises rejected with non-Error primitives (e.g. `reject("failed")`).
- **Action:** Enforce strict linter rule `@typescript-eslint/no-floating-promises` and wrap all async execution branches in structured error boundaries.

### Category C: Race Conditions & Concurrency Hazards
- **Mechanism:** Shared mutable state accessed or modified simultaneously without synchronization, or non-deterministic ordering of asynchronous operations.
- **Root Cause Indicators:** Intermittent CI failures, flaky tests passing locally but failing under heavy CPU load, data corruption after rapid UI clicks or parallel requests.
- **Action:**
  - Introduce idempotency tokens or atomic operations.
  - Implement read-write locks (`sync.RWMutex`, `Mutex`) or serialized queues.
  - Replace read-modify-write patterns with atomic transactions or database constraints.

### Category D: Memory Exhaustion & Resource Leaks
- **Mechanism:** Memory consumption growing monotonically until OOM killer or GC thrashing terminates the process.
- **Root Cause Indicators:** `JavaScript heap out of memory`, `fatal error: runtime: out of memory`, lingering open database connections, circular event listener registrations.
- **Action:** Inspect heap dumps, verify stream buffering and drain mechanisms, and ensure all open handles (file descriptors, sockets, timers) are explicitly disposed of.

---

## 4. The 5-Step Deep Root-Cause Isolation Protocol

```
+--------------------------------------------------------------------------+
| Step 1: Ingest & Cleanse Error Payload                                  |
|         Extract raw message, stack trace, command exit code, environment |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 2: Identify Failure Site vs. Trigger Origin                        |
|         Separate the crashing line from the data mutation origin         |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 3: Formulate Invariant Hypothesis                                   |
|         Define what state was expected vs. what state was observed       |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 4: Reproduce in Isolation                                           |
|         Execute targeted test or minimal reproduction snippet            |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 5: Validate Upstream vs. Downstream Fix Vector                      |
|         Determine if patch belongs at producer or consumer               |
+--------------------------------------------------------------------------+
```

### Detailed Protocol Steps

1. **Ingest & Cleanse Error Payload:**
   - Strip ANSI color escape codes.
   - Separate stdout from stderr.
   - Filter out framework internal frames (e.g. `express/lib/router`, `node:internal`, `site-packages`).

2. **Identify Failure Site vs. Trigger Origin:**
   - Locate the topmost frame in project source code.
   - Examine the line content: is it dereferencing an argument? If so, the trigger origin is the caller, not this line!
   - Follow the call stack upward 2–3 levels to observe the data pipeline.

3. **Formulate Invariant Hypothesis:**
   - State the expected invariant: *"Function `fetchUserPreferences(userId)` expects `userId` to be a non-empty string UUID."*
   - State the observed reality: *"Received `undefined` because caller decoded JWT token without checking for `sub` field presence."*

4. **Reproduce in Isolation:**
   - Run the exact unit test covering that code path:
     `npm test -- -t "should decode user token and fetch preferences"`
   - If no unit test exists, construct a temporary minimal reproduction harness before writing any fix.

5. **Validate Upstream vs. Downstream Fix Vector:**
   - **Upstream fix:** Fix the caller to satisfy the contract (e.g., validate JWT payload before invocation).
   - **Downstream fix:** Make the callee defensive if invalid input is a legitimate runtime possibility (e.g., return `UserPreferencesNotFoundResult` or throw descriptive domain error).

---

## 5. Practical Command-Line Recipes for Diagnostics

### Node.js / JavaScript
```powershell
# Run with expanded stack traces and unhandled rejection tracing
node --trace-uncaught --trace-warnings --unhandled-rejections=strict server.js

# Inspect memory heap allocation limits
node --max-old-space-size=4096 --trace-gc server.js
```

### Python
```powershell
# Run with faulthandler to trace C-level crashes & segfaults
python -X faulthandler -m pytest -vv tests/test_billing.py

# Trace warnings as errors to catch deprecations and unclosed resources
python -W error -m pytest tests/
```

### Go
```powershell
# Run tests with race detector enabled
go test -race -v ./pkg/worker/...

# Dump goroutines on hang/deadlock
$env:GOTRACEBACK="all"; go test -v ./...
```

### Rust
```powershell
# Enable full backtrace for cargo test or binary run
$env:RUST_BACKTRACE="full"; cargo test -- --nocapture
```

---

## 6. Anti-Patterns to Avoid During RCA

1. **The "Catch-and-Silence" Fallacy:** Wrapping a failing call in `try { ... } catch (e) {}` and returning `null` does not fix the bug; it converts an obvious failure into silent data corruption down the line.
2. **The "Null Coalescing Band-Aid":** Indiscriminately sprinkling `?.` (optional chaining) throughout the codebase without understanding why the property is `undefined` masks missing data propagation.
3. **Speculative Refactoring:** Rewriting an entire class or switching libraries when encountering a syntax error or configuration mismatch introduces unpredictable regressions.
4. **Altering Test Expectations:** Lowering threshold values or removing assertions to make a test suite green is a violation of engineering ethics and software reliability.
