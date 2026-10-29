# SQL Dialects & Execution Cheatsheet

| Feature | SQLite (Native Node 22) | PostgreSQL 16+ | MySQL 8.0+ |
| :--- | :--- | :--- | :--- |
| **Explain Plan** | `EXPLAIN QUERY PLAN <query>` | `EXPLAIN (ANALYZE, BUFFERS) <query>` | `EXPLAIN FORMAT=JSON <query>` |
| **Concurrent Index** | N/A (single-file locking) | `CREATE INDEX CONCURRENTLY` | `ALGORITHM=INPLACE, LOCK=NONE` |
| **UUID Generation** | `randomblob(16)` | `gen_random_uuid()` | `UUID()` |
| **JSON Extraction** | `json_extract(data, '$.key')` | `data->>'key'` | `data->>'$.key'` |
| **Upsert Syntax** | `ON CONFLICT (id) DO UPDATE` | `ON CONFLICT (id) DO UPDATE` | `ON DUPLICATE KEY UPDATE` |
| **Limit / Offset** | `LIMIT n OFFSET m` | `LIMIT n OFFSET m` | `LIMIT m, n` |
