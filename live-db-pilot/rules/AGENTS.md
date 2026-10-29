# Live Database & SQL Execution Rules

These rules govern all database inspections, raw query executions, schema alterations, and index designs executed by Antigravity agents.

---

## 1. Zero Unintended Destructive Actions
- **Read-Only by Default**: Always inspect database schemas and run queries in read-only mode (`SELECT`, `EXPLAIN`, `PRAGMA`) unless the user explicitly requests data mutation.
- **Destructive Statements Prohibited without Explicit Consent**:
  - Never execute `DROP TABLE`, `TRUNCATE`, or `DROP DATABASE` without presenting the exact command and obtaining confirmation.
  - Never run `UPDATE` or `DELETE` without a strict, indexed `WHERE` clause.
  - Wrap any manual schema migration in a transaction (`BEGIN ... COMMIT`) to ensure atomicity.

## 2. Strict SQL Injection Prevention
- Always use parameterized queries and prepared statements. Never concatenate untrusted user input directly into SQL strings.
- Validate identifier names (table names, column names) against existing schema whitelists.

## 3. Query Performance & Explain First
- Before deploying a complex multi-join or analytical query, run `EXPLAIN QUERY PLAN` to ensure that full table scans (`SCAN TABLE`) are avoided on high-cardinality tables.
- Add composite B-Tree indexes matching the Equality-Range-Sort heuristic.

## 4. Referential Integrity
- Enforce foreign key constraints (`PRAGMA foreign_keys = ON` in SQLite).
- When inserting test fixtures, resolve dependency DAGs to ensure parent records exist before inserting child records.
