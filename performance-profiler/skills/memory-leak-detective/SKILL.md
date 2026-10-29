---
name: memory-leak-detective
description: Identifies, isolates, and resolves memory leaks, uncontrolled heap growth, GC pauses, and OOM crashes across Node.js, Python, and Dart.
---

# Memory Leak Detective Skill

Expert diagnostic guide for detecting, isolating, and resolving memory leaks, uncontrolled heap growth, GC pauses, and Out-Of-Memory (OOM) crashes across Node.js, Python, and mobile (Flutter/Dart) applications.

---

## 1. When to Activate This Skill

Activate this skill when encountering:
- Process memory (RSS) steadily climbing over time without reaching an equilibrium (the classic "sawtooth" turned into a diagonal slope).
- Container pods killed by Kubernetes with `OOMKilled` (Exit Code 137).
- Frequent, long Garbage Collection (GC) pauses causing latency spikes.
- Warnings such as `MaxListenersExceededWarning: Possible EventEmitter memory leak detected`.
- Mobile apps crashing in background or stuttering due to heap memory pressure.
- Requests to profile memory or write memory leak regression tests.

---

## 2. Process Memory Fundamentals

Before hunting leaks, distinguish memory segments:
- **Resident Set Size (RSS)**: Total physical RAM allocated to the process (includes heap, stack, code segments, and native C++ bindings).
- **Heap Total**: Total memory allocated by the V8/Python VM for dynamic objects.
- **Heap Used**: Memory actively occupied by reachable objects.
- **External Memory**: Memory bound to V8 objects but allocated in C++ (e.g., Node.js `Buffer` instances).

---

## 3. Node.js Memory Leak Detection & Profiling

### A. Heap Snapshot Analysis with Chrome DevTools
1. **Start process with inspector enabled**:
   ```bash
   node --inspect=0.0.0.0:9229 server.js
   ```
2. Open `chrome://inspect` in Google Chrome and attach to the target Node process.
3. **The 3-Snapshot Technique**:
   - Take **Snapshot 1** immediately after service warmup.
   - Run a simulated load test (e.g., 500 requests via autocannon).
   - Take **Snapshot 2**.
   - Run another round of load test, then let the process idle for 10 seconds.
   - Take **Snapshot 3**.
4. In Chrome DevTools, select **Snapshot 3**, switch perspective from *Summary* to *Comparison*, and compare against *Snapshot 1*.
5. Sort by **# Delta** and **Size Delta**:
   - Any constructor with continuously increasing delta (e.g., `(closure)`, `Object`, `EventEmitter`, `Array`) indicates a leak.
   - Follow the **Retainer Tree** down to find the root reference holding the object in memory.

### B. Clinic.js Heap Profiling
```bash
npx clinic heapprofiler -- node server.js
# Then trigger traffic with autocannon
npx autocannon -c 50 -d 20s http://localhost:3000/api/users
```
Produces an interactive flame graph revealing which allocation functions grow uncontrollably over time.

### C. Common Node.js Leak Patterns & Fixes

#### 1. Forgotten Event Listeners
```typescript
// BAD: Adds a new listener on every incoming request without removing it
app.get('/events', (req, res) => {
  eventBus.on('notification', (data) => {
    res.write(JSON.stringify(data));
  });
});

// GOOD: Remove listener on client disconnect/finish
app.get('/events', (req, res) => {
  const handler = (data: any) => res.write(JSON.stringify(data));
  eventBus.on('notification', handler);
  
  res.on('close', () => {
    eventBus.off('notification', handler);
  });
});
```

#### 2. Closure Traps (Accidental Scope Retention)
```typescript
// BAD: replaceThing retains previous large object via the shared closure context
let theThing: any = null;
function replaceThing() {
  const originalThing = theThing;
  const unused = function () {
    if (originalThing) console.log("hi");
  };
  theThing = {
    longStr: new Array(1000000).join("*"),
    someMethod: function () {}
  };
}
setInterval(replaceThing, 100); // Rapid OOM!
```
*Fix*: Clear unused references (`originalThing = null;`) or decouple methods from outer scopes.

#### 3. Unbounded In-Memory Caches
```typescript
// BAD: Simple object used as unbounded cache
const cache: Record<string, any> = {};
function getCached(key: string, val: any) {
  if (!cache[key]) cache[key] = val;
  return cache[key];
}

// GOOD: Always use bounded LRU cache with max items and TTL
import { LRUCache } from 'lru-cache';
const safeCache = new LRUCache<string, any>({ max: 5000, ttl: 1000 * 60 * 10 });
```

#### 4. WeakRef and WeakMap Usage
Use `WeakMap` or `WeakRef` when associating metadata with objects whose lifecycle should not be extended by the cache:
```typescript
const metadataCache = new WeakMap<object, UserSessionMetadata>();

function attachMetadata(user: object, meta: UserSessionMetadata) {
  metadataCache.set(user, meta); // Cleared automatically when 'user' is garbage collected!
}
```

---

## 4. Python Memory Leak Detection

### A. Diagnostic Tools
1. **`tracemalloc`**:
   Built-in standard library allocation tracer.
   ```python
   import tracemalloc

   tracemalloc.start()
   snapshot1 = tracemalloc.take_snapshot()
   # Run operations...
   snapshot2 = tracemalloc.take_snapshot()

   top_stats = snapshot2.compare_to(snapshot1, 'lineno')
   print("[ Top 10 Memory Growth Lines ]")
   for stat in top_stats[:10]:
       print(stat)
   ```
2. **`objgraph` for Cyclic References**:
   ```python
   import objgraph
   # Print top increasing object types
   objgraph.show_growth(limit=5)
   # Visualize backreferences preventing GC
   objgraph.show_backrefs(leaking_objects, filename='leak_graph.png', max_depth=4)
   ```

### B. Common Python Leak Patterns
- **Circular References with Custom `__del__`**: Python's cyclic GC can struggle to collect uncollectable cycles if `__del__` methods are improperly structured.
- **Global Mutable Containers**: Module-level lists or dicts accumulating request data or exception traces (`sys.exc_info()`).
- **Unclosed Context Managers**: Failing to close DB cursors, file descriptors, or HTTP client sessions (`aiohttp.ClientSession`). Always use `async with` or `with`.

---

## 5. Mobile & Flutter / Dart Specifics

### A. Dart DevTools Memory View
- Connect DevTools to Flutter runner: `flutter run --profile`.
- In DevTools Memory tab, analyze the **Diff** between snapshots to check widget and state retention.

### B. Crucial Flutter Disposal Rules
- **Controller Cleanup**: Every `TextEditingController`, `AnimationController`, `ScrollController`, and `FocusNode` MUST be disposed in the `State.dispose()` method:
  ```dart
  @override
  void dispose() {
    _textController.dispose();
    _animationController.dispose();
    super.dispose();
  }
  ```
- **Stream Subscriptions**: Uncancelled `StreamSubscription` instances keep the widget state alive in memory even after navigating away:
  ```dart
  StreamSubscription? _sub;
  @override
  void initState() {
    super.initState();
    _sub = eventBus.stream.listen((event) { ... });
  }
  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
  ```

---

## 6. Writing Memory Leak Regression Tests

Verify that code cleans up after itself by invoking manual GC during automated tests:
```typescript
// Run Jest with: node --expose-gc ./node_modules/.bin/jest
describe('Resource Lifecycle Test', () => {
  it('does not leak connection wrappers', async () => {
    if (!global.gc) {
      throw new Error('Test must be executed with --expose-gc');
    }

    const refs: WeakRef<any>[] = [];
    {
      const service = new TemporaryClientService();
      refs.push(new WeakRef(service));
      await service.executeTask();
      await service.dispose();
    }

    // Force garbage collection
    global.gc();

    // Check if the instance was properly reclaimed
    expect(refs[0].deref()).toBeUndefined();
  });
});
```
