# OWASP Top 10 - Practical Remediation Reference

This reference provides production-ready code examples and patterns to mitigate each of the OWASP Top 10 web application security risks.

---

## 1. Broken Access Control (A01)

### Pattern: Attribute-Based Access Control (ABAC) & Tenant Isolation
Always bind record retrieval to the active user's authorization context.

#### Node.js / Express / Prisma:
```typescript
// ❌ INSECURE
export async function getInvoice(req: AuthenticatedRequest, res: Response) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id }
  });
  return res.json(invoice);
}

// ✅ SECURE
export async function getInvoice(req: AuthenticatedRequest, res: Response) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: req.params.id,
      tenantId: req.user.tenantId, // Tenant isolation
      OR: [
        { ownerId: req.user.id },
        { assignedReviewerId: req.user.id }
      ]
    }
  });

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  return res.json(invoice);
}
```

---

## 2. Cryptographic Failures (A02)

### Pattern: Modern Password Hashing with Argon2
#### Node.js:
```typescript
import argon2 from 'argon2';

// Hashing a password during signup
export async function hashPassword(plainText: string): Promise<string> {
  return await argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1
  });
}

// Verifying a password during login
export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  return await argon2.verify(hash, plainText);
}
```

### Pattern: Authenticated Symmetric Encryption (AES-256-GCM)
```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

export function encrypt(text: string, keyBuffer: Buffer): { cipherText: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    cipherText: encrypted,
    iv: iv.toString('hex'),
    authTag
  };
}

export function decrypt(cipherText: string, keyBuffer: Buffer, ivHex: string, authTagHex: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## 3. Injection (A03)

### SQL Injection: Parameterized Queries
#### PostgreSQL with `pg`:
```typescript
// ❌ INSECURE
const res = await pool.query(`SELECT * FROM products WHERE category = '${userCategory}'`);

// ✅ SECURE
const res = await pool.query(
  'SELECT id, name, price FROM products WHERE category = $1 AND active = true',
  [userCategory]
);
```

### Command Injection: Safe Process Execution
#### Python:
```python
import subprocess

# ❌ INSECURE: shell=True with user concatenation
# subprocess.run(f"grep {pattern} /var/log/app.log", shell=True)

# ✅ SECURE: Pass arguments as an immutable list without shell invocation
def search_log(pattern: str):
    result = subprocess.run(
        ["grep", "--", pattern, "/var/log/app.log"],
        capture_output=True,
        text=True,
        check=False
    )
    return result.stdout
```

---

## 4. Insecure Design (A04)

### Pattern: Sliding-Window Rate Limiting (Redis)
Protect public endpoints from brute-force and resource exhaustion.

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args)
  })
});
```

---

## 5. Security Misconfiguration (A05)

### Standard Security Headers with Helmet
```typescript
import express from 'express';
import helmet from 'helmet';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Disable X-Powered-By
app.disable('x-powered-by');
```

---

## 6. Identification and Authentication Failures (A07)

### Secure Cookie Configuration for JWTs
```typescript
res.cookie('access_token', token, {
  httpOnly: true,                 // Inaccessible to client-side JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict',             // CSRF defense
  maxAge: 15 * 60 * 1000          // 15-minute expiration
});
```

---

## 7. Server-Side Request Forgery (SSRF) (A10)

### URL Validation & Private IP Blocklist
```typescript
import { URL } from 'url';
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

export async function validateOutboundUrl(rawUrl: string): Promise<string> {
  const parsed = new URL(rawUrl);

  // 1. Only allow HTTP and HTTPS
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Unsupported protocol');
  }

  // 2. Resolve DNS to verify destination IP
  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (!addresses || addresses.length === 0) {
    throw new Error('Could not resolve hostname');
  }

  for (const { address } of addresses) {
    const ip = ipaddr.parse(address);
    const range = ip.range();

    // 3. Reject loopback, private, linkLocal, broadcast, carrier-grade NAT
    const forbiddenRanges = [
      'loopback',
      'private',
      'linkLocal',
      'carrierGradeNat',
      'broadcast',
      'reserved',
      'uniqueLocal'
    ];

    if (forbiddenRanges.includes(range)) {
      throw new Error(`Outbound target resolves to forbidden internal IP: ${address}`);
    }
  }

  return parsed.toString();
}
```
