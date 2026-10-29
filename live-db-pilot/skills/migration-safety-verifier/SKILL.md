---
name: migration-safety-verifier
description: Test, validate, and verify database schema migrations safely. Prevents table locks, verifies rollbacks, and enforces the Expand and Contract pattern for zero-downtime releases.
---

# Migration Safety Verifier

This skill guides the agent in designing, testing, and verifying zero-downtime database migrations across Prisma, Drizzle, TypeORM, Alembic, and raw SQL.

## When to Activate
- Creating new database migrations or altering existing tables.
- Renaming columns or tables in production databases.
- Adding `NOT NULL` columns or unique constraints to populated tables.

---

## Zero-Downtime Migration Principles

### 1. The Expand and Contract Pattern
Never rename a column directly in a single release (`ALTER TABLE users RENAME COLUMN name TO full_name;` breaks existing running application pods during rolling updates).

Follow the 3-phase rollout:
1. **Expand**: Add the new column as nullable (`ALTER TABLE users ADD COLUMN full_name TEXT;`). Write to both columns in application code.
2. **Backfill**: Run a background batch worker to populate `full_name` from existing `name` rows.
3. **Contract**: Update application code to read only from `full_name`. In a subsequent release, drop the legacy column `name`.

### 2. Testing Forward and Rollback
Every migration script must include a verifiable rollback:
- Test step 1: Run migration `up`. Verify new columns and constraints exist.
- Test step 2: Run migration `down`. Verify schema returns cleanly to initial state without orphaned constraints.
- Test step 3: Re-run migration `up`. Verify idempotency.

### 3. Avoiding Exclusive Table Locks
- In PostgreSQL, adding an index locks table writes unless `CONCURRENTLY` is specified:
  ```sql
  CREATE INDEX CONCURRENTLY idx_users_email ON users (email);
  ```
- In SQLite, run migrations inside a single explicit transaction to ensure all-or-nothing rollback.
