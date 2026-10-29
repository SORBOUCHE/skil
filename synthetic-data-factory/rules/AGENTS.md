# Synthetic Data Factory — Agent Operational Rules

These directives govern all agents operating under the `synthetic-data-factory` plugin. Any agent producing synthetic fixtures, database seed scripts, or executing stress/load tests must adhere strictly to these principles.

---

## 1. Zero Production PII & Absolute Privacy Compliance
- **Never copy or use real production Personally Identifiable Information (PII)** under any circumstances.
- Synthetic datasets must replace names, phone numbers, email addresses, government identifiers (SSN, National IDs), credit card numbers, and physical addresses with pseudo-random or rule-based fake equivalents (e.g., Faker, Chance, custom generators).
- Adhere to data privacy regulations including **GDPR**, **HIPAA**, and **CCPA**:
  - Medical codes, clinical notes, and billing identifiers must be generated from synthetic code catalogs (e.g., synthetic ICD-10/CPT codes).
  - Financial data (IBANs, card numbers) must use standard test ranges (e.g., Luhn-valid test card prefixes like 4242 4242 4242).
- When synthesizing fixtures derived from real production statistics, ensure **k-anonymity** and **differential privacy** safeguards so original individuals cannot be re-identified via outlier values or attribute combinations.

---

## 2. Strict Referential Integrity & Topological Ordering
- **Foreign Key Consistency**: Every child record referencing a parent entity's primary key (`FOREIGN KEY (parent_id) REFERENCES parent(id)`) must resolve to a valid, existing parent entity in the generated set. No dangling or orphaned foreign keys are permitted unless explicitly modeling an intentional edge-case corrupt state.
- **Topological Generation Order**:
  1. Determine table/entity dependency DAG (Directed Acyclic Graph).
  2. Synthesize root tables first (e.g., `organizations`, `tenants`, `roles`, `categories`).
  3. Synthesize first-tier dependent tables (e.g., `users`, `products`).
  4. Synthesize associative/junction and transaction tables (e.g., `orders`, `order_items`, `user_roles`).
  5. Handle circular references using deferred constraints, null initial foreign keys with secondary update passes, or synthetic sentinel values.
- **Unique Constraint Enforcements**:
  - Guarantee uniqueness across simulated primary keys, slugs, emails, and usernames using tracking sets (`Set<T>`) or collision-resistant sequence generators (UUIDv4/v7, ULID, Snowflake IDs).

---

## 3. Load & Stress Testing Safety Guardrails
- **Gradual Ramp-Up & Cool-Down Cycles**:
  - Never execute instantaneous peak traffic spikes (e.g., jumping from 0 to 1,000 VUs in 1 second) unless specifically modeling an unmitigated DDOS/flash-sale resilience test.
  - Standard stress tests must follow a staged profile:
    1. **Warmup / Smoke test**: 5-10 VUs for 30s to verify schema validity, authentication tokens, and endpoint availability.
    2. **Ramp-up**: Incremental step-ladder load increases (e.g., 50 -> 100 -> 250 -> 500 VUs).
    3. **Sustained Plateau**: Hold target load to measure p90/p95/p99 latency, throughput (RPS), and resource consumption.
    4. **Cool-down**: Monotonic reduction of virtual users to zero to allow connection pools, queue consumers, and garbage collection to settle.
- **Safe Target Environments**:
  - Never trigger load tests against external third-party APIs (Stripe, Twilio, SendGrid, Auth0) without sandboxing or mock server interception (e.g., WireMock, MSW, Prism).
  - Explicitly verify target host URLs belong to isolated staging, QA, or local development environments before launching autocannon/k6 workloads.

---

## 4. Realistic Statistical Distributions & Edge Cases
- Avoid uniform distributions for human behaviors. Implement realistic skew:
  - **Pareto Principle (80/20 rule)**: 20% of users generate 80% of orders; top 5% of products receive 70% of views.
  - **Normal & Log-normal Distributions**: Response sizes, session durations, transaction values, and birth dates.
  - **Temporal Realism**: Timestamps must maintain causal consistency: `created_at` <= `updated_at` <= `shipped_at` <= `delivered_at`.
- Provide configured ratios of edge cases:
  - Nullable fields (10-25% nulls where permitted).
  - Boundary strings: empty strings `""`, Unicode strings with RTL characters, emojis (e.g., `🚀 Test Unit`), multi-byte Japanese/Arabic text, and strings at maximum column length limits (`VARCHAR(255)`).
  - Boundary numeric values: 0, negative values (where signed), minimum and maximum integers or decimals.

---

## 5. Deterministic Seeding & Idempotence
- All data synthesis engines must support deterministic random seed configuration (`--seed 42` or `faker.seed(1234)`).
- Re-running the fixture generator with the identical schema and seed value must produce the exact identical dataset byte-for-byte, enabling deterministic integration testing and reproducible debugging in CI/CD pipelines.
