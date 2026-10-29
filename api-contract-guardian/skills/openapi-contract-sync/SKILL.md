---
name: openapi-contract-sync
description: Comprehensive guide for generating, validating, and updating OpenAPI 3.1 specifications, generating frontend TypeScript types with openapi-typescript, and enforcing CI/CD contract integrity.
tags: [openapi, swagger, types, typescript, schema, api-contract, contract-first]
version: 1.0.0
---

# OpenAPI 3.1 Contract Synchronization Skill

## 1. Executive Summary

Maintaining an accurate, synchronized API contract between backend services and frontend applications is the single most effective safeguard against runtime bugs, silent UI breakage, and costly integration delays.

This guide provides end-to-end instructions for:
1. Understanding and leveraging **OpenAPI 3.1** modern features.
2. Generating OpenAPI specs from backend code (**Code-First**) or writing specs upfront (**Design-First**).
3. Automating frontend TypeScript type generation using `openapi-typescript` and type-safe clients using `openapi-fetch`.
4. Linting and enforcing spec governance with **Spectral**.
5. Detecting breaking changes automatically in CI/CD pipelines using **oasdiff**.

---

## 2. OpenAPI 3.1 Modern Architecture

OpenAPI 3.1 represents a massive evolution over OpenAPI 3.0:
- **100% JSON Schema Draft 2020-12 Compatibility**: No more divergent dialect mismatches between JSON Schema and OpenAPI.
- **Type Arrays for Nullability**: Replaces OpenAPI 3.0's `nullable: true` with standard JSON Schema `type: ["string", "null"]`.
- **First-Class Webhooks**: Top-level `webhooks` key for defining outbound server-to-client notifications.
- **Enhanced Discriminator & Polymorphism**: Full support for `anyOf`, `oneOf`, and `allOf` with unified JSON Schema validation semantics.

### Standard OpenAPI 3.1 Document Anatomy

```yaml
openapi: 3.1.0
info:
  title: Workspace Core API
  version: 1.4.0
  description: High-reliability API contract with strict schema adherence.
servers:
  - url: https://api.workspace.internal/v1
    description: Production environment
  - url: http://localhost:4000/v1
    description: Local development environment

paths:
  /users:
    get:
      summary: Retrieve paginated users list
      operationId: listUsers
      tags:
        - Users
      parameters:
        - name: page
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: Successfully retrieved user list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedUserList'
        '400':
          $ref: '#/components/responses/ValidationError'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - fullName
        - createdAt
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        fullName:
          type: string
          minLength: 2
        avatarUrl:
          type: ["string", "null"]
          format: uri
        createdAt:
          type: string
          format: date-time

    PaginatedUserList:
      type: object
      required:
        - items
        - total
        - page
        - limit
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/User'
        total:
          type: integer
        page:
          type: integer
        limit:
          type: integer

  responses:
    ValidationError:
      description: Request validation failed (RFC 7807)
      content:
        application/problem+json:
          schema:
            type: object
            required:
              - type
              - title
              - status
              - detail
            properties:
              type:
                type: string
              title:
                type: string
              status:
                type: integer
              detail:
                type: string
              errors:
                type: array
                items:
                  type: object
                  properties:
                    field: { type: string }
                    message: { type: string }
```

---

## 3. Backend Spec Generation (Code-First)

### A. Node.js / Express with Zod (`@asteasolutions/zod-to-openapi`)

Using Zod schemas to derive runtime validation, controller guards, and OpenAPI 3.1 documents from one single definition:

```typescript
// schemas/user.schema.ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const UserSchema = z.object({
  id: z.string().uuid().openapi({ example: '123e4567-e89b-12d3-a456-426614174000' }),
  email: z.string().email().openapi({ example: 'engineer@corp.internal' }),
  fullName: z.string().min(2).openapi({ example: 'Alex Mercer' }),
  avatarUrl: z.string().url().nullable().openapi({ example: null }),
  createdAt: z.string().datetime().openapi({ example: '2026-10-13T20:00:00.000Z' }),
}).openapi('User');

export type UserDTO = z.infer<typeof UserSchema>;
```

Registry and Document Generator:
```typescript
// scripts/generate-openapi.ts
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import * as fs from 'node:fs';
import { UserSchema } from '../schemas/user.schema';

const registry = new OpenAPIRegistry();
registry.register('User', UserSchema);

registry.registerPath({
  method: 'get',
  path: '/v1/users/{id}',
  summary: 'Find user by ID',
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'User details',
      content: { 'application/json': { schema: UserSchema } },
    },
    404: {
      description: 'User not found',
    },
  },
});

const generator = new OpenApiGeneratorV31(registry.definitions);
const openApiDoc = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Workspace API',
    version: '1.0.0',
  },
  servers: [{ url: '/v1' }],
});

fs.writeFileSync('./contracts/openapi.json', JSON.stringify(openApiDoc, null, 2));
console.log('OpenAPI 3.1 contract successfully exported to contracts/openapi.json');
```

### B. Python / FastAPI Spec Export

FastAPI generates OpenAPI schemas out-of-the-box. Export the schema automatically during CI or test suites:

```python
# scripts/export_openapi.py
import json
from pathlib import Path
from main import app  # Your FastAPI instance

def export_schema():
    openapi_data = app.openapi()
    output_path = Path("contracts/openapi.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_data, f, indent=2)
    print(f"Exported FastAPI OpenAPI specification to {output_path}")

if __name__ == "__main__":
    export_schema()
```

---

## 4. Frontend Type Generation with `openapi-typescript`

Never manually replicate backend schemas in frontend codebase. Use `openapi-typescript` to convert OpenAPI 3.0/3.1 specs directly into strict TypeScript interfaces.

### Step 1: Install Dependencies
```bash
npm install -D openapi-typescript
npm install openapi-fetch
```

### Step 2: Configure Script in `package.json`
```json
{
  "scripts": {
    "sync:types": "openapi-typescript ./contracts/openapi.json -o ./src/lib/api/schema.d.ts --empty-objects-unknown false"
  }
}
```

### Step 3: Consume in Frontend with `openapi-fetch`
`openapi-fetch` is an ultra-lightweight (sub-2KB), 100% type-safe fetch client that utilizes the generated `schema.d.ts`:

```typescript
// src/lib/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from './schema';

export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1',
  headers: {
    'Accept': 'application/json',
  },
});

// src/features/users/api.ts
import { apiClient } from '../../lib/api/client';

export async function fetchUserById(userId: string) {
  // Completely type-safe path, params, and response!
  const { data, error, response } = await apiClient.GET('/users/{id}', {
    params: {
      path: { id: userId },
    },
  });

  if (error) {
    // Typed error schema
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  // 'data' is strictly inferred as User schema
  return data;
}
```

---

## 5. Specification Linting & Spectral Governance

Enforce consistency across path casing, description presence, and RFC 7807 compliance using **Spectral**.

### `.spectral.yaml` Configuration:
```yaml
extends: ["spectral:oas"]
rules:
  # Enforce kebab-case for URL path segments
  paths-kebab-case:
    description: "Paths must be lowercase and use kebab-case"
    given: "$.paths[*]~"
    then:
      function: pattern
      functionOptions:
        match: "^(\\/[a-z0-9]+(-[a-z0-9]+)*)+$"

  # Enforce camelCase or snake_case consistently for schema properties
  properties-camel-case:
    description: "Schema properties must follow camelCase"
    given: "$.components.schemas.*.properties.*~"
    then:
      function: pattern
      functionOptions:
        match: "^[a-z][a-zA-Z0-9]*$"

  # Mandatory operationId for every endpoint
  operation-operationId-required:
    description: "Every operation must define an operationId for codegen tools"
    severity: error
    given: "$.paths.*[get,post,put,delete,patch]"
    then:
      field: operationId
      function: defined

  # Enforce RFC 7807 problem details for 4xx and 5xx errors
  rfc7807-error-responses:
    description: "Error responses must include application/problem+json or structured errors"
    severity: warn
    given: "$.paths.*[get,post,put,delete,patch].responses[?(@property >= 400)].content"
    then:
      field: "application/problem+json"
      function: defined
```

Run spectral check:
```bash
npx @stoplight/spectral-cli lint ./contracts/openapi.json
```

---

## 6. Breaking Change Detection in CI/CD

Integrate `oasdiff` in your CI pipeline to block pull requests that break contract backwards compatibility.

### GitHub Actions Workflow Step:
```yaml
name: API Contract Guard

on:
  pull_request:
    paths:
      - 'contracts/openapi.json'
      - 'src/backend/**'

jobs:
  breaking-change-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout PR Branch
        uses: actions/checkout@v4

      - name: Checkout Base Branch
        uses: actions/checkout@v4
        with:
          ref: ${{ github.base_ref }}
          path: base-branch

      - name: Run oasdiff Breaking Change Detector
        uses: oasdiff/oasdiff-action/breaking@v0.0.18
        with:
          base: base-branch/contracts/openapi.json
          revision: contracts/openapi.json
          fail-on: ERR
```

### Breaking Change Criteria Guarded:
1. Endpoint removal or verb change.
2. New required parameters in query, path, or body.
3. Removed attributes in responses.
4. Changed data types or altered formats (e.g. `uuid` $\to$ `int64`).
5. Altered enum values or restricted value domains.

---

## 7. Recommended Daily Workflow

| Step | Action | Command / Tool |
|---|---|---|
| **1. Spec Update** | Update backend routes / Zod / Pydantic models | Automated script / code edit |
| **2. Spec Generation** | Re-export `openapi.json` | `npm run generate:openapi` |
| **3. Contract Linting** | Lint spec against governance rules | `npx @stoplight/spectral-cli lint ./contracts/openapi.json` |
| **4. Type Sync** | Regenerate frontend TypeScript types | `npm run sync:types` |
| **5. Frontend Validation** | Run frontend type check to spot compile errors | `npm run typecheck` (e.g., `tsc --noEmit`) |
| **6. PR Gate** | Automated CI check for breaking changes | `oasdiff breaking` |
