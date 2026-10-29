# API Contract Integrity & Agent Governance Rules

This document establishes non-negotiable rules and standards for all agents designing, modifying, or auditing client-server interfaces, API routes, data transfer objects (DTOs), and communication schemas within this workspace.

---

## 1. Core Architectural Axiom: Contract-First or Strictly Synchronized

1. **Explicit Schema Validation at Boundaries**:
   - Every API endpoint that receives or returns data must have an authoritative schema definition.
   - Acceptable validation libraries include:
     - **TypeScript/Node**: Zod, Valibot, TypeBox, or ts-rest schemas.
     - **Python**: Pydantic v2 or FastAPI response models.
     - **Go**: Struct tags validated with go-playground/validator or OpenAPI-generated structs.
     - **Direct Specification**: OpenAPI 3.1 / JSON Schema Draft 2020-12.
   - Raw untyped payloads (`any`, `unknown` without guard, `dict[str, Any]` without model) at boundary ingress/egress are strictly prohibited.

2. **Single Source of Truth (SSOT)**:
   - There must never be two disconnected manual definitions of the same data structure (e.g., a backend SQL model and a hand-written frontend TypeScript interface without automated linkage or validation).
   - Either:
     - Generate OpenAPI specs from backend code and generate frontend TypeScript types from the OpenAPI spec (`openapi-typescript`), OR
     - Define the contract in a shared schema package (e.g. Zod/TypeBox in a monorepo shared package), OR
     - Write the OpenAPI 3.1 specification first and generate both client and server stubs.

---

## 2. Zero Breaking Changes Policy

1. **Backwards Compatibility Standard**:
   - Existing active clients (mobile apps, web SPAs, third-party consumers) must never be broken by server-side deployments.
   - **Breaking Change Definition**:
     - Removing an existing endpoint or changing its HTTP method.
     - Removing a field from a response payload that was previously present.
     - Adding a required field to a request body, query parameter, or header.
     - Changing the data type of an existing field (e.g., `number` to `string`, or non-nullable `string` to `string | null`).
     - Narrowing an accepted enum or response status code.
     - Modifying URL path structures without redirect / deprecation.

2. **Versioning Requirements**:
   - If a breaking change is mandatory, introduce a new API version:
     - **URI Path Versioning** (preferred): `/api/v1/resources` $\to$ `/api/v2/resources`.
     - **Header Versioning** (acceptable): `Accept: application/vnd.app.v2+json`.
   - Never mutate an existing `/v1/` endpoint in a non-backwards-compatible manner.
   - Mark deprecated endpoints using OpenAPI `deprecated: true` and the HTTP `Sunset` / `Deprecation` header (RFC 8594) with a minimum 6-month grace window where applicable.

3. **Additive-Only Evolution**:
   - Non-breaking changes should be additive:
     - Adding optional fields with default values to requests.
     - Adding new fields to response payloads (clients must tolerate unexpected fields and not crash).
     - Adding new endpoints.

---

## 3. Client-Server Type Synchronization Mandate

1. **No Manual Duplicate Interfaces**:
   - Frontend developers must never copy-paste backend model interfaces into frontend directories without linking to a shared type generation target.
   - Run type synchronization as part of the local build or pre-commit hook:
     ```bash
     npm run generate:api-types
     ```
2. **Strict Optionality & Nullability Alignment**:
   - Never confuse `undefined` (omitted key), `null` (explicit empty value), and `""` (empty string).
   - In JSON payloads, `undefined` does not exist over the wire; fields are either omitted or `null`.
   - Frontend types must accurately reflect wire reality:
     - Optional field on wire: `fieldName?: string | null` or `fieldName?: string`.
     - Non-nullable guaranteed field: `fieldName: string`.
   - Never mark a field non-nullable in frontend types if the database column or backend schema allows `NULL`.

3. **Date & Decimal Normalization**:
   - Timestamps transmitted across HTTP must use ISO-8601 strings (`2026-10-13T20:57:00.000Z`) or UNIX timestamps with explicit documentation of precision (seconds vs milliseconds).
   - Frontend DTOs must type wire dates as `string` (or transform via Zod `.transform((val) => new Date(val))`), never assume the wire delivers a native JavaScript `Date`.
   - Monetary values and high-precision numbers must be transmitted as strings or integer cents/micros to prevent IEEE-754 floating point precision loss.

---

## 4. Standardized Error Handling Contracts

1. **RFC 7807 Problem Details Standard**:
   - All HTTP error responses ($4xx$ and $5xx$) must conform to a standardized error contract:
     ```json
     {
       "type": "https://api.example.com/errors/validation-failed",
       "title": "Validation Failed",
       "status": 422,
       "detail": "Field 'email' must be a valid email address.",
       "instance": "/api/v1/users/45",
       "errors": [
         {
           "field": "email",
           "message": "Invalid email format",
           "code": "invalid_string"
         }
       ]
     }
     ```
   - Never return raw plain-text errors, random unformatted JSON (`{ "err": "boom" }`), or raw database stack traces in production responses.

---

## 5. Mock Server Discipline

1. **Spec Compliance**:
   - Mock servers must adhere 100% to the active OpenAPI 3.1 schema.
   - Mock response status codes, header values, and schema structures must be identical to the eventual backend implementation.
2. **Realistic Network Simulation**:
   - Always test frontend UI against realistic mock latency ($50\text{ms} - 450\text{ms}$) to uncover race conditions, missing loading spinners, and layout thrashing.
   - Simulate intermittent error states ($401, 403, 404, 422, 500$) to verify client resilience before backend integration.
