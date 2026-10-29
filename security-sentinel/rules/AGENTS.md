# Security Sentinel - Agent Security Directives

This document defines non-negotiable security mandates for all AI agents, code generators, and refactoring tasks running within this workspace.

---

## 1. Zero Hardcoded Credentials Policy

- **Environment Variables Only**: All API tokens, secret keys, passwords, private keys, database credentials, and service tokens MUST be retrieved from environment variables (e.g., `process.env.DB_PASSWORD`, `os.environ.get("OPENAI_API_KEY")`) or a secure secret manager (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault).
- **Prohibited in Source Files**:
  - Never place production or test secrets in `.js`, `.ts`, `.py`, `.json`, `.yaml`, or `.env` files committed to version control.
  - Never embed private keys (`-----BEGIN PRIVATE KEY-----`) in application source files.
  - `.env.example` must contain only empty strings or dummy placeholders (e.g., `DATABASE_URL=postgres://user:password@localhost:5432/app_db`).
- **Secret Detection Reaction**: If an existing hardcoded secret is encountered during a refactor or audit, isolate it immediately, replace it with an environment variable reference, and warn the developer that the credential must be rotated.

---

## 2. Strict Input Sanitization & Parameterized Queries

- **SQL / NoSQL Injection Prevention**:
  - Direct string concatenation or template literal interpolation into SQL or NoSQL queries is **STRICTLY FORBIDDEN**.
  - Always use parameterized queries, prepared statements, or modern type-safe ORM/Query Builders (Prisma, Drizzle, TypeORM, SQLAlchemy, etc.).
  - Bad: `db.query(`SELECT * FROM users WHERE email = '${email}'`)`
  - Good: `db.query('SELECT * FROM users WHERE email = $1', [email])`
- **Command Injection Prevention**:
  - Avoid invoking shell commands using dynamic user inputs (`exec`, `system`, `popen`).
  - When process execution is required, use array argument passing without shell interpolation (e.g., `execFile('cmd', [arg1, arg2])` or `subprocess.run(['cmd', arg1, arg2], shell=False)`).
- **Template & Path Injection**:
  - Always normalize and validate filesystem paths with path whitelisting and resolution checks (`path.resolve()`, ensuring the target starts with the expected base directory).
  - Never allow raw user input in SSR template engines (Jinja2, EJS, Pug) without explicit contextual escaping.

---

## 3. Cryptographic Standards & Safe Hashing

- **Banned for Passwords**:
  - **MD5**, **SHA-1**, and plain **SHA-256** without salt/stretching are forbidden for password or credential storage.
- **Approved Password Hashers**:
  - **Argon2id** (preferred standard).
  - **bcrypt** (minimum work factor: 12).
  - **PBKDF2** (minimum 600,000 iterations for SHA-256).
- **Encryption & Key Management**:
  - Symmetric data encryption must use **AES-256-GCM** or **ChaCha20-Poly1305** (authenticated encryption).
  - Never use ECB mode.
  - IVs/nonces must be cryptographically random and never reused with the same key.
  - Use `crypto.randomBytes` or `secrets.token_bytes` for cryptographically secure pseudo-random number generation. Never use `Math.random()` or `random.random()` for tokens, nonces, or security keys.

---

## 4. Defense in Depth: Client Validation vs Server Enforcement

- **Server is the Single Source of Truth**:
  - Client-side validation (HTML attributes, React Hook Form, Zod on client) is for UX only.
  - Every API endpoint and server action MUST independently validate, sanitize, and authorize incoming requests.
- **Broken Access Control & IDOR Guard**:
  - Never trust client-supplied identifiers (`userId`, `role`, `tenantId`, `orgId`) in request bodies or query params.
  - Always verify that the authenticated session owns or has permission to access the target resource.
  - Example: Query by `WHERE id = :id AND user_id = :sessionUserId`.

---

## 5. Session Management & JWT Security

- **JWT Best Practices**:
  - Sign tokens with strong secrets or asymmetric key pairs (RS256/ES256).
  - Reject `none` algorithm unconditionally.
  - Store sensitive session tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies rather than `localStorage`.
  - Set reasonable expiration times (`exp`) and implement token refresh flows with rotation.
- **CORS & Security Headers**:
  - Do not use wildcard `Access-Control-Allow-Origin: *` when credentials (`Access-Control-Allow-Credentials: true`) are enabled.
  - Enforce standard security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`.

---

## 6. Information Leakage & Error Handling

- **Error Masking in Production**:
  - Never return stack traces, raw database error messages, or internal file paths to API clients.
  - Log error details securely on the server with sanitized metadata (no PII, no passwords).
  - Return generic error payloads to clients (e.g., `{"error": "InternalServerError", "trackingId": "..."}`).
