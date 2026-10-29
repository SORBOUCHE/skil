# B-Tree Indexing Playbook

## Indexing Sequence Heuristic
For any `SELECT` query:
```sql
SELECT c1, c2 FROM tbl WHERE colA = 1 AND colB = 2 AND colC > 100 ORDER BY colD ASC;
```
The optimal B-Tree index ordering MUST BE:
1. Equality columns: `colA`, `colB`
2. Range columns: `colC`
3. Sort columns: `colD`
4. Covered columns (optional): `c1`, `c2`

```sql
CREATE INDEX idx_tbl_opt ON tbl (colA, colB, colC, colD);
```

## Anti-Patterns to Avoid
- **Indexing Low-Cardinality Booleans**: Indexing an `is_active` boolean column rarely helps unless combined with a high-cardinality foreign key.
- **Leading Wildcard Queries**: `WHERE name LIKE '%term'` cannot use standard B-Tree indexes. Use Trigram indexes (pg_trgm) or Full-Text Search (FTS5) instead.
- **Function Wrappers on Indexed Columns**: `WHERE LOWER(email) = '...'` invalidates index on `email`. Create an expression index `CREATE INDEX idx_email_lower ON users (LOWER(email));`.
