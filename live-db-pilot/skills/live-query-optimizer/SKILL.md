---
name: live-query-optimizer
description: Inspect and optimize database queries using real-time execution plans, index generation, and performance tuning for SQLite, PostgreSQL, and MySQL.
---

# Live Query Optimizer

This skill guides the agent in profiling slow SQL queries, reading database execution plans, and generating optimal indexes to achieve sub-millisecond query performance.

## When to Activate
- The user reports slow database response times or asks to optimize a query.
- When designing or reviewing complex SQL queries with multiple `JOIN`s, `GROUP BY`, or `ORDER BY`.
- When adding new tables or columns that will experience high query traffic.

---

## 4-Step Query Optimization Journey

### Step 1: Baseline & Execution Plan Inspection
Always run `EXPLAIN QUERY PLAN` on SQLite or `EXPLAIN (ANALYZE, BUFFERS)` on PostgreSQL before applying indexes:
- Look for red flags:
  - `SCAN TABLE <name>`: Full table scan. Every row in the table is read into memory.
  - `USE TEMP B-TREE FOR ORDER BY`: In-memory sorting required because no index matches the sort direction.
  - Nested Loop joins with high row estimates.

### Step 2: Index Heuristic (Equality, Range, Sort)
Follow the standard B-Tree indexing sequence:
1. **Equality columns** first (`WHERE status = 'active' AND tenant_id = 12`)
2. **Range columns** second (`WHERE created_at >= '2026-01-01'`)
3. **Sort columns** last (`ORDER BY created_at DESC`)

Example optimal index:
```sql
CREATE INDEX idx_orders_tenant_status_created 
ON orders (tenant_id, status, created_at DESC);
```

### Step 3: Covering Indexes
When reading only a few columns, include them in the index so the database engine never needs to touch the main table heap:
```sql
-- PostgreSQL:
CREATE INDEX idx_users_lookup ON users (email) INCLUDE (id, full_name);
```

### Step 4: Verification & Comparison
Re-run the query with the new index and verify:
- `SCAN TABLE` is replaced with `SEARCH TABLE ... USING INDEX`.
- Execution duration dropped significantly.
