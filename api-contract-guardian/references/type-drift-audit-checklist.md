# Type Drift Audit Checklist

A comprehensive verification checklist for engineering teams and autonomous agents to detect, diagnose, and remediate contract divergence between backend services and client applications.

---

## Phase 1: Endpoint & Boundary Reconnaissance

- [ ] **Boundary Inventory**:
  - [ ] All HTTP REST endpoints are cataloged in an OpenAPI 3.1 or JSON Schema registry.
  - [ ] Real-time channels (WebSockets, SSE events) have explicit message schema contracts.
  - [ ] Background job payloads and webhook notifications are versioned and documented.

- [ ] **Contract Single Source of Truth (SSOT)**:
  - [ ] No manual copy-pasting of backend classes/interfaces into frontend directories.
  - [ ] Type definitions in the client are auto-generated (via `openapi-typescript` or shared schema packages like Zod/TypeBox).
  - [ ] Spec generator script is integrated into the backend build/commit lifecycle.

---

## Phase 2: Structural & Type Alignment Verification

### 1. Nullability & Optionality
- [ ] **Distinction between `null` and `undefined`**:
  - Wire JSON never transmits `undefined`; fields are either present with a value, present with `null`, or omitted.
- [ ] **Database Column Nullability**:
  - Any database column defined as `NULL` is typed as nullable in the backend DTO and frontend interface (`foo: string | null` or `foo?: string | null`).
- [ ] **Optional Request Body Fields**:
  - Optional request payload fields have documented server-side default values.

### 2. Casing & Key Naming Conventions
- [ ] **Consistent JSON Property Casing**:
  - Ingress and egress payloads follow a single unified convention (typically `camelCase` for JSON APIs).
- [ ] **ORM/Database Leakage Guard**:
  - Database snake_case columns (`user_id`, `created_at`) are explicitly transformed to camelCase (`userId`, `createdAt`) before serialization, or an explicit serializer is configured.

### 3. Date & Temporal Serialization
- [ ] **No Native `Date` Assumptions**:
  - Wire DTOs represent dates strictly as ISO-8601 strings (`2026-10-13T20:57:00.000Z`) or UNIX timestamps.
  - Client types declare date fields as `string` (or parse through a Zod transform).
- [ ] **Timezone Normalization**:
  - All timestamps over the wire are serialized in UTC (`Z` suffix) to prevent local client clock distortion.

### 4. Numeric Precision & Identifiers
- [ ] **64-bit Integer Stringification**:
  - PostgreSQL `BIGINT`, Twitter-style Snowflake IDs, and large 64-bit integers are transmitted as `string` to prevent IEEE-754 precision loss in browser V8 engines.
- [ ] **Financial & Decimal Representation**:
  - Monetary values are transmitted either as integer cents/micros (`1050` = $10.50) or as fixed-precision strings (`"10.50"`), never floating point numbers (`10.499999999`).

### 5. Enum & Literal Exhaustiveness
- [ ] **Exhaustive Matching**:
  - Frontend switches on enum values contain a default/fallback handler to prevent unhandled state crashes when backend adds new enum values.
- [ ] **Enum Synchronization**:
  - Backend enum additions trigger automated regeneration of client TypeScript union types.

---

## Phase 3: Runtime Envelope & Error Adherence

- [ ] **Envelope Uniformity**:
  - Paginated endpoints use a standard envelope structure across all resources:
    ```json
    { "items": [...], "page": 1, "pageSize": 20, "total": 140 }
    ```
- [ ] **Undeclared Field Stripping**:
  - Ingress endpoints strip unexpected/malicious properties (`stripUnknown: true` in Zod/Pydantic) to prevent mass-assignment vulnerabilities.
- [ ] **RFC 7807 Compliance**:
  - All $4xx$ and $5xx$ responses return structured `application/problem+json` with standard fields (`type`, `title`, `status`, `detail`).
  - No plain-text error messages or unhandled framework HTML error pages leak into API consumers.

---

## Phase 4: CI/CD Enforcement & Automation Gates

- [ ] **Automated Breaking Change Check**:
  - CI pipeline executes `oasdiff breaking` comparing the PR branch OpenAPI spec with `main`.
- [ ] **Pre-commit Spec Verification**:
  - Spec validation (`@stoplight/spectral-cli`) runs on pre-commit to reject invalid OpenAPI documents.
- [ ] **Frontend Compile Gate**:
  - Client CI runs `tsc --noEmit` against freshly synchronized types to ensure no frontend file references retired or modified properties.

---

## Phase 5: Drift Severity Scoring Matrix

| Severity | Condition | Immediate Action |
|---|---|---|
| **CRITICAL** | Field marked non-nullable on client returns `null` or is missing at runtime | Block deployment. Update client to handle null or restore backend payload. |
| **CRITICAL** | Endpoint URL, HTTP verb, or required parameter changed without API versioning | Block deployment immediately. Revert backend or introduce versioned route (`/v2/`). |
| **HIGH** | Numeric ID precision loss due to `BIGINT` sent as raw JavaScript `number` | Change serializer to transmit ID as string. Update client interface. |
| **MEDIUM** | Undeclared properties leaking from backend into responses | Add DTO response projection / schema whitelist. |
| **LOW** | Minor description discrepancy in OpenAPI spec | Update docstrings or annotations in backend codebase. |
