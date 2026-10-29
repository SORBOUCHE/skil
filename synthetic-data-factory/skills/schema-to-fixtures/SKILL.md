---
name: schema-to-fixtures
description: Comprehensive engine for parsing SQL DDL, Prisma schemas, TypeScript interfaces, and Pydantic models to generate high-fidelity, relational mock data and fixtures.
---

# Schema-to-Fixtures: Relational Synthetic Data Engine

The `schema-to-fixtures` skill enables automated parsing of database schemas, ORM specifications, and strongly typed models into high-fidelity, referentially sound synthetic datasets. It generates production-grade mock records formatted as SQL `INSERT` statements, JSON collections, CSV exports, or ORM seed scripts.

---

## 1. Core Architecture & Processing Pipeline

The fixture generation pipeline follows a five-stage compiler architecture:

```
[ Input Schema ] ──> [ AST Extraction ] ──> [ Dependency DAG ] ──> [ Topological Resolver ] ──> [ Data Synthesizer ] ──> [ Exporters ]
(SQL/Prisma/TS/Py)   (Fields, Types, FKs)   (Parent -> Child Graph) (Generation Sequence)        (Distributions/Faker)    (SQL/JSON/CSV)
```

1. **AST Parser**: Ingests schema source files and extracts tables/models, fields, native data types, nullability, primary key constraints, foreign key targets, and unique indexes.
2. **Dependency Graph Construction**: Builds a Directed Acyclic Graph (DAG) where nodes represent entities and directed edges represent foreign key relationships (`Child -> Parent`).
3. **Topological Sorter**: Computes the exact generation order ensuring parent records exist before dependent foreign key references are populated.
4. **Data Synthesizer**: Applies domain heuristics, statistical distributions (Pareto, Gaussian), and edge-case pools to produce realistic attribute values.
5. **Output Serializer**: Streams generated records into SQL batches (`INSERT INTO ... VALUES (...)`), nested/flat JSON files, CSV spreadsheets, or executable ORM seed scripts (`prisma.seed.ts`, `seeds.py`).

---

## 2. Supported Input Formats & Parsing Strategies

### 2.1 SQL DDL (PostgreSQL, MySQL, SQLite)
Parses standard `CREATE TABLE` statements, column constraints, primary keys, and foreign key definitions.

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(120) NOT NULL,
    plan_tier VARCHAR(20) DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    total_cents INT NOT NULL CHECK (total_cents >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) NOT NULL,
    placed_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**Parsing Rules**:
- Check constraints like `CHECK (status IN ('active', ...))` are converted into enum selection pools.
- Default functions (`gen_random_uuid()`, `CURRENT_TIMESTAMP`) guide synthetic generators to supply realistic values if omitted.
- Foreign key dependencies (`REFERENCES tenants(id)`) enforce graph edges: `tenants -> users -> orders`.

---

### 2.2 Prisma Schema (`schema.prisma`)
Parses models, relations, scalar types, attributes (`@id`, `@default`, `@relation`, `@unique`), and enum definitions.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  CUSTOMER
  ADMIN
  OPERATOR
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  domain    String   @unique
  users     User[]
  createdAt DateTime @default(now())
}

model User {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  email          String       @unique
  role           Role         @default(CUSTOMER)
  posts          Post[]
  createdAt      DateTime     @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  title     String
  content   String?
  published Boolean  @default(false)
  viewCount Int      @default(0)
  createdAt DateTime @default(now())
}
```

**Parsing Rules**:
- Scalar types map to generators: `String` -> context-aware strings, `Int` -> integer pools, `DateTime` -> temporal sequences.
- Relation fields (`@relation(fields: [authorId], references: [id])`) identify exact foreign key linkages and parent models.

---

### 2.3 TypeScript Interfaces & Zod Schemas
Parses TypeScript model definitions and Zod validation schemas for API fixtures.

```typescript
export interface CustomerProfile {
  id: string; // uuid
  email: string;
  age: number; // min: 18, max: 80
  isActive: boolean;
  tags: string[];
  billingAddress: {
    street: string;
    city: string;
    countryCode: string; // ISO 3166-1 alpha-2
    postalCode: string;
  };
  signupDate: Date;
}
```

---

### 2.4 Python Pydantic & SQLAlchemy Models
Extracts field types, validation constraints (`Field(ge=0, le=100)`), and relationship linkages.

```python
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class AccountTier(str):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class SyntheticUser(BaseModel):
    user_id: str = Field(..., description="UUIDv4 identifier")
    email: EmailStr
    account_tier: AccountTier = AccountTier.FREE
    reputation_score: int = Field(ge=0, le=1000)
    last_login: Optional[datetime] = None
```

---

## 3. Referential Integrity & Dependency Resolution

### 3.1 Topological Sort Algorithm
To generate relational data without foreign key constraint violations, the factory executes Kahn's algorithm or Depth-First Search (DFS) topological sort:

```typescript
// Topological Dependency Sorter
interface EntityDependency {
  name: string;
  dependsOn: string[];
}

function resolveGenerationOrder(entities: EntityDependency[]): string[] {
  const inDegree: Map<string, number> = new Map();
  const graph: Map<string, string[]> = new Map();

  entities.forEach(e => {
    inDegree.set(e.name, 0);
    graph.set(e.name, []);
  });

  entities.forEach(entity => {
    entity.dependsOn.forEach(dependency => {
      // dependency must precede entity
      graph.get(dependency)?.push(entity.name);
      inDegree.set(entity.name, (inDegree.get(entity.name) || 0) + 1);
    });
  });

  const queue: string[] = [];
  inDegree.forEach((degree, name) => {
    if (degree === 0) queue.push(name);
  });

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== entities.length) {
    throw new Error("Cycle detected in entity dependencies! Use deferred constraint resolution.");
  }

  return order;
}
```

### 3.2 Handling Self-Referential & Circular Dependencies
When tables reference themselves (e.g., `employees.manager_id -> employees.id` or `categories.parent_id -> categories.id`):
1. **Pass 1 (Roots)**: Generate a root cohort of 5-10 records with `parent_id = NULL`.
2. **Pass 2 (Children)**: Generate remaining records, picking random `parent_id` values exclusively from the IDs created in Pass 1 or previous batches.
3. For mutual cycles (Table A references Table B, Table B references Table A):
   - Generate Table A with foreign keys set to temporary placeholder `NULL`.
   - Generate Table B referencing the newly created Table A records.
   - Run a reconciliation update pass (`UPDATE table_a SET b_id = ...`) to complete the bi-directional association.

---

## 4. Realistic Statistical Distributions & Data Heuristics

Synthetic data is useless for realistic performance and UI testing if every record looks identical or follows flat uniform distributions. The factory applies realistic statistical modeling:

### 4.1 Activity & Volume Skew (Pareto 80/20 Rule)
In production applications, activity is heavily concentrated. When linking child records (e.g. `orders`) to parent records (e.g. `users`):

```typescript
function sampleParetoIndex(maxItems: number, alpha: number = 1.16): number {
  // Generates Pareto distribution where ~20% of entities get ~80% of references
  const u = Math.random();
  const index = Math.floor(maxItems * (Math.pow(1 - u, -1 / (alpha - 1)) - 1) / (Math.pow(1 - 0.99, -1 / (alpha - 1)) - 1));
  return Math.min(Math.max(0, index), maxItems - 1);
}
```

### 4.2 Causal Temporal Consistency
Timestamps must follow natural chronological progression:
$$\text{created\_at} \le \text{updated\_at} \le \text{processed\_at} \le \text{completed\_at}$$

```typescript
function generateTemporalChain(baseDate: Date) {
  const createdAt = new Date(baseDate.getTime() + Math.random() * 86400000 * 30);
  const updatedAt = new Date(createdAt.getTime() + Math.random() * 3600000 * 24);
  const shippedAt = Math.random() > 0.15 
    ? new Date(updatedAt.getTime() + Math.random() * 3600000 * 48) 
    : null;
  const deliveredAt = shippedAt 
    ? new Date(shippedAt.getTime() + Math.random() * 3600000 * 72) 
    : null;

  return { createdAt, updatedAt, shippedAt, deliveredAt };
}
```

### 4.3 Context-Aware Semantic Field Matching
The parser matches field names to realistic domain generators:
- `email`, `user_email`, `contact_mail` -> RFC 5322 synthetic emails with varied domains (`@testcorp.internal`, `@example.com`).
- `phone`, `mobile_number` -> Valid format E.164 strings (`+1-555-019-XXXX`).
- `slug`, `permalink` -> Kebab-case normalized strings matching item titles.
- `currency` -> Standard ISO 4217 currency codes (`USD`, `EUR`, `GBP`, `JPY`, `CAD`).
- `price_cents`, `subtotal` -> Realistic price distributions with customary endings (`.99`, `.00`, `.50`).
- `ip_address` -> Valid IPv4/IPv6 synthetic blocks (`192.168.x.x`, `10.x.x.x`, `2001:db8::/32`).

---

## 5. Edge Case & Stress Boundary Injection

Every synthesized dataset should include a controlled ratio of stress test edge cases:

| Edge Case Category | Description & Test Purpose | Examples / Values |
|---|---|---|
| **String Boundaries** | Empty strings, single characters, max length (`VARCHAR(255)`) | `""`, `"A"`, `"Lorem..."` (exact 255 chars) |
| **Multilingual & RTL** | Unicode normalization, RTL text flow, accented glyphs | `"مرحبا بالعالم"`, `"日本語テスト"`, `"Éléonore Zürich"` |
| **Special Characters** | Escaping vulnerabilities, emoji rendering, whitespace | `"<script>alert(1)</script>"`, `Robert'); DROP TABLE Students;--`, `🚀🔥⚡` |
| **Numeric Boundaries** | Negative numbers, integer overflows, floating-point precision | `-1`, `0`, `2147483647`, `0.0000001`, `99999999.99` |
| **Temporal Boundaries** | Leap years, daylight saving, UNIX epoch, far future | `1970-01-01T00:00:00Z`, `2000-02-29`, `2038-01-19T03:14:07Z`, `2099-12-31` |
| **Sparse Data / Nulls** | Validate optional field handling and UI crash resilience | `null`, `undefined`, empty arrays `[]`, empty objects `{}` |

---

## 6. Complete Implementation: Standalone Fixture Generator

Below is a complete, production-ready TypeScript/Node.js script that reads a schema definition, resolves foreign keys, and outputs a coherent multi-table relational dataset:

```typescript
import { writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

interface Organization {
  id: string;
  name: string;
  domain: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

interface User {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: 'member' | 'admin' | 'owner';
  isActive: boolean;
  createdAt: string;
}

interface Project {
  id: string;
  organizationId: string;
  creatorId: string;
  title: string;
  budgetUsd: number;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}

export function generateSyntheticDataset(counts: { orgs: number; usersPerOrg: number; projectsPerOrg: number }) {
  const orgs: Organization[] = [];
  const users: User[] = [];
  const projects: Project[] = [];

  const companies = ['Acme Corp', 'Starlight Labs', 'Quantum Dynamics', 'Apex Logistics', 'Hyperion Health', 'Nova Retail'];
  const plans: Organization['plan'][] = ['free', 'pro', 'enterprise'];
  const firstNames = ['Sarah', 'David', 'Layla', 'Elena', 'Tariq', 'Marcus', 'Aoi', 'Mateo'];
  const lastNames = ['Connor', 'Smith', 'Mansoor', 'Vance', 'Chen', 'Garcia', 'Kowalski', 'Al-Sayed'];

  // Step 1: Generate Organizations (Root Table)
  for (let i = 0; i < counts.orgs; i++) {
    const orgId = randomUUID();
    const baseName = companies[i % companies.length] + ` ${i + 1}`;
    const domain = baseName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.test';
    
    orgs.push({
      id: orgId,
      name: baseName,
      domain,
      plan: plans[Math.floor(Math.random() * plans.length)],
      createdAt: new Date(Date.now() - Math.random() * 1000 * 3600 * 24 * 365).toISOString()
    });
  }

  // Step 2: Generate Users (Depends on Organization)
  orgs.forEach(org => {
    const orgUsersCount = counts.usersPerOrg;
    for (let u = 0; u < orgUsersCount; u++) {
      const userId = randomUUID();
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${u > 0 ? u : ''}@${org.domain}`;

      users.push({
        id: userId,
        organizationId: org.id,
        email,
        fullName: `${fn} ${ln}`,
        role: u === 0 ? 'owner' : (u < 3 ? 'admin' : 'member'),
        isActive: Math.random() > 0.05,
        createdAt: new Date(new Date(org.createdAt).getTime() + Math.random() * 1000 * 3600 * 24 * 30).toISOString()
      });
    }
  });

  // Step 3: Generate Projects (Depends on Org and Users)
  orgs.forEach(org => {
    const orgUserList = users.filter(u => u.organizationId === org.id);
    for (let p = 0; p < counts.projectsPerOrg; p++) {
      const creator = orgUserList[Math.floor(Math.random() * orgUserList.length)];
      projects.push({
        id: randomUUID(),
        organizationId: org.id,
        creatorId: creator.id,
        title: `Project Alpha-${org.name.split(' ')[0]}-${p + 1}`,
        budgetUsd: Math.floor(Math.random() * 50000) + 1000,
        status: ['draft', 'active', 'archived'][Math.floor(Math.random() * 3)] as any,
        createdAt: new Date(new Date(creator.createdAt).getTime() + Math.random() * 1000 * 3600 * 24 * 10).toISOString()
      });
    }
  });

  return { orgs, users, projects };
}

// Format as SQL Dump
export function exportToSqlInserts(dataset: ReturnType<typeof generateSyntheticDataset>): string {
  const lines: string[] = ['BEGIN TRANSACTION;\n'];

  dataset.orgs.forEach(o => {
    lines.push(`INSERT INTO organizations (id, name, domain, plan, created_at) VALUES ('${o.id}', '${o.name.replace(/'/g, "''")}', '${o.domain}', '${o.plan}', '${o.createdAt}');`);
  });

  dataset.users.forEach(u => {
    lines.push(`INSERT INTO users (id, organization_id, email, full_name, role, is_active, created_at) VALUES ('${u.id}', '${u.organizationId}', '${u.email}', '${u.fullName.replace(/'/g, "''")}', '${u.role}', ${u.isActive}, '${u.createdAt}');`);
  });

  dataset.projects.forEach(p => {
    lines.push(`INSERT INTO projects (id, organization_id, creator_id, title, budget_usd, status, created_at) VALUES ('${p.id}', '${p.organizationId}', '${p.creatorId}', '${p.title.replace(/'/g, "''")}', ${p.budgetUsd}, '${p.status}', '${p.createdAt}');`);
  });

  lines.push('\nCOMMIT;');
  return lines.join('\n');
}
```

---

## 7. Verification & Seed Quality Checklist

Before committing generated fixtures to a repository or using them for load tests, run the following verification checks:

- [ ] **Referential Integrity**: 100% of foreign keys resolve to a valid primary key in the dataset.
- [ ] **Uniqueness Constraints**: No duplicates in fields marked `@unique`, `UNIQUE`, or primary keys.
- [ ] **Type & Boundary Conformance**: Numbers, dates, and strings fall strictly within valid database column bounds.
- [ ] **Zero PII**: No real email addresses, social security numbers, live phone numbers, or production payment details.
- [ ] **Deterministic Reproducibility**: Providing the same seed parameter yields byte-for-byte identical output.
