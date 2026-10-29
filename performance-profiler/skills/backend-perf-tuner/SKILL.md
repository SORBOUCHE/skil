---
name: backend-perf-tuner
description: Diagnoses and optimizes server latency, database queries, N+1 issues, connection pooling, and event loop lag for high-throughput APIs.
---

# Backend Performance Tuner Skill

Comprehensive guide for diagnosing, profiling, and optimizing backend server applications, database queries, API response latency, and system concurrency.

---

## 1. When to Activate This Skill

Activate this skill when encountering:
- API response latency exceeding SLOs (e.g., p95 > 500ms or p99 > 1500ms).
- Database CPU spikes, high disk I/O, or thread pool exhaustion.
- Event loop lag or CPU starvation in Node.js services.
- High memory or CPU utilization in Python web frameworks (FastAPI, Django, Flask).
- N+1 query patterns causing hundreds of queries per request.
- Requests to optimize database schemas, queries, caching architecture, or server throughput (RPS).

---

## 2. Scientific Profiling Methodology

Never optimize without rigorous instrumentation:
1. **Establish Baselines**:
   Measure throughput (Requests Per Second) and latency distributions (**p50**, **p90**, **p95**, **p99**) under simulated realistic load using tools like `autocannon`, `k6`, or `wrk`.
   ```bash
   # Autocannon baseline test
   npx autocannon -c 100 -d 30s https://api.local/v1/orders
   ```
2. **Decompose the Waterfall**:
   Break down the total latency into components:
   - DNS + TLS Handshake
   - Network Transit / TTFB
   - Application Gateway / Middleware overhead
   - Database / Cache query execution time
   - Payload serialization & compression
3. **Isolate the Primary Bottleneck**:
   Identify whether the bottleneck is I/O-bound (database, downstream HTTP service) or CPU-bound (JSON serialization, crypto, sync loops).
4. **Iterate Singularity**:
   Make **one change at a time**. Measure immediately under identical load conditions to isolate cause and effect.

---

## 3. Database Optimization & Query Tuning

### A. Execution Plan Analysis
Always run `EXPLAIN (ANALYZE, BUFFERS, VERBOSE)` in PostgreSQL or `EXPLAIN ANALYZE` in MySQL:
- **Sequential Scans (`Seq Scan`)**: Indicates table scans. Examine filters and consider indexes.
- **Index Scans vs Index Only Scans**: Index Only Scans avoid reading heap pages entirely when all queried fields exist in the index.
- **Cost vs Actual Time**: Compare planner estimates with actual millisecond execution times. Discrepancies indicate outdated table statistics (`ANALYZE table_name;`).

### B. Strategic Indexing
- **Composite Indexes & Column Ordering**:
  Follow the **ESR Rule** (Equality, Sort, Range):
  ```sql
  -- Query: WHERE status = 'active' AND created_at > '2026-01-01' ORDER BY priority DESC
  -- Optimal Index:
  CREATE INDEX idx_orders_status_priority_created 
  ON orders (status, priority DESC, created_at);
  ```
- **Covering Indexes (`INCLUDE`)**:
  Include extra projection columns to enable Index-Only scans without bloating the B-tree key:
  ```sql
  CREATE INDEX idx_users_email_covering 
  ON users (email) INCLUDE (first_name, last_name, avatar_url);
  ```
- **Partial Indexes**:
  Index only the rows matching frequent query conditions:
  ```sql
  -- Index only unresolved tickets instead of millions of closed ones
  CREATE INDEX idx_tickets_unresolved 
  ON tickets (assigned_to, priority) 
  WHERE status != 'closed';
  ```
- **When NOT to Index**:
  - Low-cardinality columns (e.g., boolean flags) without partial filters.
  - Tables with heavy write/insert throughput where index maintenance outweighs read savings.
  - Small tables that fit into a few disk pages.

### C. N+1 Detection & Resolution
- **Problem**: Executing 1 query to fetch parent records, followed by N queries to fetch child records in a loop.
- **Prisma Eager Loading Fix**:
  ```typescript
  // Bad: fetching comments in a loop
  // Good: single join or batch query
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: { author: true, comments: { take: 5 } }
  });
  ```
- **DataLoader Pattern (GraphQL / Microservices)**:
  Batch and memoize individual load requests within a single tick:
  ```typescript
  import DataLoader from 'dataloader';

  const userLoader = new DataLoader(async (userIds: readonly string[]) => {
    const users = await db.users.findMany({ where: { id: { in: [...userIds] } } });
    const userMap = new Map(users.map(u => [u.id, u]));
    return userIds.map(id => userMap.get(id) || null);
  });
  ```

### D. Connection Pooling
- Never establish a new database connection per incoming HTTP request (TCP/TLS handshake adds 20–100ms per call).
- Use **PgBouncer** in transaction pooling mode for PostgreSQL, or configure ORM pool limits:
  ```typescript
  // Recommended pool size formula:
  // pool_size = (core_count * 2) + effective_spindle_count
  const pool = new Pool({
    max: 20, // Maximum active connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  ```

---

## 4. HTTP & API Performance

### A. Compression & Protocol
- Enable **Brotli** or **Gzip** compression for text-based payloads (JSON, HTML, CSS). Brotli generally yields 15–25% smaller sizes than Gzip at compression level 4–6.
- Enforce **HTTP/2** or **HTTP/3** to leverage multiplexing, header compression (HPACK), and binary framing, eliminating head-of-line blocking.

### B. High-Performance Pagination: Cursor vs Offset
- **Offset Anti-pattern**: `SELECT * FROM items ORDER BY id LIMIT 50 OFFSET 100000;`
  The database must scan and discard 100,000 rows before returning 50.
- **Cursor-based Solution**:
  ```sql
  SELECT id, title, created_at 
  FROM items 
  WHERE id > $last_seen_id 
  ORDER BY id ASC 
  LIMIT 50;
  ```
  Executes in O(log N) utilizing B-tree index traversal.

### C. Field Projection
Never return `SELECT *` across large schemas. Project only the fields requested by the consumer:
```typescript
const users = await db.user.findMany({
  select: { id: true, name: true, email: true } // Exclude bio, settings, metadata
});
```

---

## 5. Multi-Layer Caching Architecture

### A. In-Memory LRU Cache
For immutable or slowly changing dictionary data (e.g., tenant configs, permission definitions):
```typescript
import { LRUCache } from 'lru-cache';

const configCache = new LRUCache<string, TenantConfig>({
  max: 500,
  ttl: 1000 * 60 * 15, // 15 minutes TTL
});
```

### B. Redis Cache-Aside Pattern
```typescript
async function getProductDetails(productId: string): Promise<Product> {
  const cacheKey = `product:${productId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const product = await db.product.findById(productId);
  if (product) {
    // Add jitter to TTL to prevent cache stampede
    const ttlSeconds = 3600 + Math.floor(Math.random() * 300);
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(product));
  }
  return product;
}
```

---

## 6. Node.js Runtime Tuning

### A. Diagnosing Event Loop Delays
- Run `clinic doctor -- node server.js` or `clinic flame -- node server.js` to detect event loop blockage.
- Monitor event loop delay programmatically:
  ```javascript
  const { monitorEventLoopDelay } = require('node:perf_hooks');
  const h = monitorEventLoopDelay({ resolution: 20 });
  h.enable();

  setInterval(() => {
    const p99Ms = h.percentile(99) / 1e6;
    if (p99Ms > 50) {
      console.warn(`[EVENT LOOP BLOCKED] p99 delay: ${p99Ms.toFixed(2)}ms`);
    }
    h.reset();
  }, 5000);
  ```

### B. Streaming Large Payloads
Do not read full files or datasets into memory buffers:
```typescript
import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';

app.get('/export.csv', async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  const dbStream = getLargeDataStream();
  await pipeline(dbStream, transformCsvStream, res);
});
```

### C. Worker Threads for CPU-Intensive Work
Offload password hashing, cryptographic signatures, image resizing, and heavy data parsing away from the main thread using `worker_threads` or `Piscina`.

---

## 7. Python Runtime Tuning

- **Asynchronous Frameworks**: Use FastAPI or Starlette with `uvicorn` and `uvloop` for high-concurrency I/O operations.
- **Worker Configuration**: Run Gunicorn with Uvicorn worker class:
  ```bash
  gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
  ```
  Rule of thumb: `workers = (2 * CPU_CORES) + 1`.
- **Profiling with py-spy & cProfile**:
  ```bash
  py-spy record -o profile.svg --pid 1234
  ```
  Inspect flame graph SVG to identify functions consuming excessive CPU cycles.
