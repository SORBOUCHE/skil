# SQL Optimization & Query Tuning Patterns Reference

A quick-reference guide for diagnosing execution plans, indexing strategies, anti-patterns, and PostgreSQL high-performance techniques.

---

## 1. How to Read `EXPLAIN (ANALYZE, BUFFERS)`

When analyzing queries in PostgreSQL, always execute:
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, COSTS)
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC;
```

### Key Execution Node Types:
1. **`Seq Scan` (Sequential Scan)**:
   - Reads every page and row of the table sequentially.
   - *Acceptable*: For small tables (< 1000 rows) or when retrieving > 25% of table rows.
   - *Bottleneck*: When combined with large `Rows Removed by Filter` on big tables. Indicates missing index.
2. **`Index Scan`**:
   - Traverses index B-tree to find matching tuples, then reads the corresponding heap pages for remaining data columns.
3. **`Index Only Scan`**:
   - Optimal. All columns in the query are present in the index itself. Heap reads are eliminated (governed by the visibility map).
4. **`Bitmap Index Scan` + `Bitmap Heap Scan`**:
   - Gathers row locations from one or multiple indexes, sorts by physical disk page, and reads pages in sequential physical order. Common for OR queries or range scans.

### Critical Buffer & Cost Metrics:
- **`Buffers: shared hit=X read=Y`**:
  - `hit`: Pages found in PostgreSQL shared buffers (RAM).
  - `read`: Pages read from disk (or OS filesystem cache).
  - High `read` values indicate I/O bottlenecks and cache misses.
- **Estimated Rows vs Actual Rows**:
  - Large discrepancies (e.g., `rows=1` vs `actual rows=85000`) mean stale optimizer statistics. Fix with `ANALYZE table_name;`.

---

## 2. Common Indexing Patterns & Applications

| Index Type / Pattern | Syntax Example | Best Used For |
| :--- | :--- | :--- |
| **B-Tree (Default)** | `CREATE INDEX idx_users_email ON users(email);` | Equality (`=`), range (`<`, `<=`, `>`, `>=`), prefix sorting (`ORDER BY`). |
| **Composite (Multi-column)** | `CREATE INDEX idx_orders_cust_date ON orders(customer_id, created_at DESC);` | Queries filtering on `customer_id` and ordering by `created_at`. Follow equality columns first. |
| **Covering Index (`INCLUDE`)** | `CREATE INDEX idx_acc_lookup ON accounts(account_number) INCLUDE (balance, status);` | Enables Index-Only Scans while keeping the B-tree key lean and focused. |
| **Partial Index** | `CREATE INDEX idx_active_jobs ON jobs(scheduled_at) WHERE status = 'pending';` | Fast lookup over a small active subset; saves index disk space and update overhead. |
| **Expression / Functional** | `CREATE INDEX idx_users_lower_email ON users(LOWER(email));` | Queries using transformations like `WHERE LOWER(email) = 'test@example.com'`. |
| **GIN (Generalized Inverted)** | `CREATE INDEX idx_docs_meta ON docs USING gin (metadata);` | JSONB operators (`?`, `@>`), full-text search (`tsvector`), array containment (`&&`). |
| **BRIN (Block Range)** | `CREATE INDEX idx_logs_created ON audit_logs USING brin (created_at);` | Naturally ordered append-only time-series data; uses tiny fraction of RAM compared to B-tree. |

---

## 3. Query Rewriting Anti-Patterns

### Anti-Pattern 1: Non-SARGable WHERE Clauses
Applying functions to indexed columns prevents the query planner from using standard B-tree index lookups:
- **Bad**: `WHERE DATE(created_at) = '2026-10-13'` *(Forces full table scan)*
- **Good**: `WHERE created_at >= '2026-10-13 00:00:00' AND created_at < '2026-10-14 00:00:00'` *(Uses range index scan)*

- **Bad**: `WHERE username LIKE '%smith'` *(Leading wildcard prevents B-tree traversal)*
- **Good**: Use trigram index (`pg_trgm` extension) with `USING gin (username gin_trgm_ops)`.

### Anti-Pattern 2: Implicit Type Conversions
- **Bad**: Comparing a `VARCHAR` column with an integer literal (`WHERE phone_number = 123456789`).
- **Fix**: Match types explicitly (`WHERE phone_number = '123456789'`).

### Anti-Pattern 3: Indiscriminate `SELECT *`
- Increases network transit and serialization time.
- Prevents the engine from utilizing Index-Only Scans.
- Always specify required projection: `SELECT id, name, status FROM users;`.

### Anti-Pattern 4: High-Offset Pagination
- **Bad**: `SELECT * FROM activity_feed ORDER BY id DESC LIMIT 20 OFFSET 50000;` *(Scans 50,020 rows)*
- **Good (Keyset / Cursor)**: `SELECT * FROM activity_feed WHERE id < $last_id ORDER BY id DESC LIMIT 20;` *(Direct B-tree seek)*

---

## 4. N+1 Query Detection & Fixes

### The N+1 Phenomenon
```python
# 1 Query to get 50 users
users = db.query(User).limit(50).all()

# N Queries (50 separate queries executed in loop)
for user in users:
    profile = db.query(Profile).filter_by(user_id=user.id).first()
```

### Solutions:
1. **SQL Join / Eager Loading**:
   ```sql
   SELECT u.id, u.name, p.bio, p.avatar_url 
   FROM users u 
   LEFT JOIN profiles p ON p.user_id = u.id 
   LIMIT 50;
   ```
2. **Batch Query with `IN (...)`**:
   Fetch all user IDs, then run one single follow-up query:
   ```sql
   SELECT * FROM profiles WHERE user_id IN (1, 2, 3, ..., 50);
   ```

---

## 5. PostgreSQL-Specific Advanced Optimizations

### A. Declarative Table Partitioning
Partition massive tables (e.g., millions of rows per month) by range to enable **partition pruning**:
```sql
CREATE TABLE sensor_readings (
    id BIGSERIAL,
    recorded_at TIMESTAMPTZ NOT NULL,
    temperature NUMERIC
) PARTITION BY RANGE (recorded_at);

-- Partition for October 2026
CREATE TABLE readings_2026_10 PARTITION OF sensor_readings
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```
Queries filtering by date automatically scan only the relevant partition, eliminating scans on billions of old rows.

### B. Tuning Work Memory for Sorting & Hashes
If `EXPLAIN ANALYZE` shows `Sort Method: external merge Disk: 45000kB`, the query spilled memory to disk.
Increase `work_mem` for the transaction session:
```sql
SET work_mem = '64MB';
-- Run complex aggregation query
RESET work_mem;
```
