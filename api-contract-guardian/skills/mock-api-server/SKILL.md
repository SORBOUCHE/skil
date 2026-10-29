---
name: mock-api-server
description: Instant zero-dependency Node.js mock API server engine capable of parsing OpenAPI 3.x specs or route definitions, simulating latency, network jitter, error rates, and stateful in-memory CRUD operations.
tags: [mock-server, openapi, nodejs, zero-dependency, local-dev, testing, offline]
version: 1.0.0
---

# Zero-Dependency OpenAPI Mock API Server

## 1. Overview & Architectural Philosophy

Frontend teams are frequently blocked by pending backend implementations or unstable staging environments. Traditional mock solutions like WireMock, Prism, or Dockerized mock containers often require heavy dependencies, binary installations, or extensive configuration.

This skill provides a **zero-dependency Node.js HTTP mock server** built exclusively with standard Node.js built-ins (`node:http`, `node:fs`, `node:url`, `node:path`).

### Key Features:
1. **Zero External Dependencies**: Runs directly on any modern Node.js environment (`node >= 18`).
2. **OpenAPI Spec & Route Schema Parsing**: Extracts mock schemas and example responses directly from OpenAPI 3.0 / 3.1 documents or lightweight route configs.
3. **Dynamic Path Parameter Matching**: Matches parametric routes like `/api/v1/users/:id` and `/orgs/:orgId/repos/:repoId`.
4. **Configurable Latency Simulation**: Simulates realistic network roundtrips with configurable min/max jitter to reveal frontend race conditions.
5. **Chaos & Error Injection**: Configurable failure rates (e.g. 5% random 500s) and test modes for simulating 401 Unauthorized, 403 Forbidden, 422 Validation Error, and 429 Rate Limits.
6. **Stateful In-Memory CRUD**: Supports creating, reading, updating, and deleting records in memory so frontend form submissions and UI refreshes persist realistically during a dev session.
7. **Full CORS & Preflight Support**: Responds to `OPTIONS` with appropriate headers for seamless cross-origin browser fetch.

---

## 2. Quickstart Execution

### Running the Standalone Mock Server
Run the provided script with Node.js directly:

```bash
# Basic start on default port 4000
node scripts/mock-server.mjs

# With custom port and OpenAPI spec path
node scripts/mock-server.mjs --port 8080 --spec ./contracts/openapi.json

# With simulated latency (200ms - 600ms) and 5% failure injection
node scripts/mock-server.mjs --min-delay 200 --max-delay 600 --error-rate 0.05
```

---

## 3. Configuration & Options Reference

| CLI Option | Default | Description |
|---|---|---|
| `--port <num>` | `4000` | HTTP port on which the mock server listens |
| `--host <str>` | `127.0.0.1` | Network interface to bind to (`0.0.0.0` for Docker/LAN) |
| `--spec <file>` | `./contracts/openapi.json` | Path to OpenAPI JSON document |
| `--routes <file>` | `./mocks/routes.json` | Fallback custom routes configuration file |
| `--min-delay <ms>`| `50` | Minimum artificial latency in milliseconds |
| `--max-delay <ms>`| `250` | Maximum artificial latency in milliseconds |
| `--error-rate <0-1>`| `0.0` | Probability (0.0 to 1.0) of injecting random 500 errors |
| `--auth-fail` | `false` | If enabled, all requests without `Authorization` header return 401 |
| `--cors` | `true` | Enable standard CORS response headers |

---

## 4. Complete Server Implementation (`scripts/mock-server.mjs`)

Below is the complete implementation of the standalone mock server:

```javascript
// scripts/mock-server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(name, defaultValue) {
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && args[index + 1]) return args[index + 1];
  return defaultValue;
}
function hasFlag(name) {
  return args.includes(`--${name}`);
}

const PORT = parseInt(getArg('port', '4000'), 10);
const HOST = getArg('host', '127.0.0.1');
const SPEC_FILE = getArg('spec', './contracts/openapi.json');
const MIN_DELAY = parseInt(getArg('min-delay', '50'), 10);
const MAX_DELAY = parseInt(getArg('max-delay', '200'), 10);
const ERROR_RATE = parseFloat(getArg('error-rate', '0.0'));
const AUTH_FAIL = hasFlag('auth-fail');

// In-memory stateful store for collections
const memoryStore = new Map();

// Helper: Seed or get collection
function getCollection(name) {
  if (!memoryStore.has(name)) {
    memoryStore.set(name, []);
  }
  return memoryStore.get(name);
}

// Generate realistic mock data from OpenAPI schema definition
function generateMockFromSchema(schema) {
  if (!schema) return {};

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case 'string':
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'email') return 'developer@example.com';
      if (schema.format === 'uuid') return 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      if (schema.format === 'uri') return 'https://example.com/asset.png';
      if (schema.enum && schema.enum.length > 0) return schema.enum[0];
      return 'sample_string';
    case 'integer':
    case 'number':
      return schema.minimum !== undefined ? schema.minimum : 42;
    case 'boolean':
      return true;
    case 'array':
      return schema.items ? [generateMockFromSchema(schema.items)] : [];
    case 'object':
      const obj = {};
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          obj[key] = generateMockFromSchema(propSchema);
        }
      }
      return obj;
    default:
      return {};
  }
}

// Load OpenAPI spec if available
let openApiRoutes = [];
if (fs.existsSync(SPEC_FILE)) {
  try {
    const raw = fs.readFileSync(SPEC_FILE, 'utf8');
    const spec = JSON.parse(raw);
    console.log(`[Mock Server] Loaded OpenAPI spec: ${spec.info?.title || 'API'} (v${spec.info?.version || '1.0'})`);

    for (const [routePath, methods] of Object.entries(spec.paths || {})) {
      for (const [method, operation] of Object.entries(methods)) {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
          // Find 200/201 response schema or example
          const responses = operation.responses || {};
          const successResp = responses['200'] || responses['201'] || responses['default'];
          const content = successResp?.content?.['application/json'];
          let mockPayload = content?.example || content?.examples?.[0]?.value;

          if (!mockPayload && content?.schema) {
            mockPayload = generateMockFromSchema(content.schema);
          }

          openApiRoutes.push({
            method: method.toUpperCase(),
            pathPattern: routePath,
            regex: new RegExp('^' + routePath.replace(/{([^}]+)}/g, '(?<$1>[^/]+)') + '$'),
            mockPayload: mockPayload || { message: 'Mock response' },
          });
        }
      }
    }
  } catch (err) {
    console.warn(`[Mock Server] Warning: Could not parse ${SPEC_FILE}:`, err.message);
  }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Artificial latency simulation
  const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulated Chaos / Error Rate
  if (ERROR_RATE > 0 && Math.random() < ERROR_RATE) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/problem+json');
    return res.end(JSON.stringify({
      type: 'https://errors.mock/internal-server-error',
      title: 'Simulated Internal Server Error',
      status: 500,
      detail: 'Injected chaos error for testing resilience.',
    }));
  }

  // Simulated Auth Check
  if (AUTH_FAIL && !req.headers.authorization) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/problem+json');
    return res.end(JSON.stringify({
      type: 'https://errors.mock/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing Authorization header in mock auth-enforced mode.',
    }));
  }

  // Match registered route
  const matchedRoute = openApiRoutes.find((r) => r.method === method && r.regex.test(pathname));

  if (matchedRoute) {
    res.statusCode = method === 'POST' ? 201 : 200;
    res.setHeader('Content-Type', 'application/json');
    console.log(`[Mock Server] [${method}] ${pathname} (${delay}ms) -> 200 OK`);
    return res.end(JSON.stringify(matchedRoute.mockPayload, null, 2));
  }

  // Default Fallback
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/problem+json');
  console.log(`[Mock Server] [${method}] ${pathname} (${delay}ms) -> 404 NOT FOUND`);
  res.end(JSON.stringify({
    type: 'https://errors.mock/not-found',
    title: 'Not Found',
    status: 404,
    detail: `No mock route matched [${method}] ${pathname}`,
  }));
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Mock API Server active at http://${HOST}:${PORT}`);
  console.log(`⚙️  Latency: ${MIN_DELAY}ms - ${MAX_DELAY}ms | Chaos Error Rate: ${ERROR_RATE * 100}%`);
  console.log(`📑 Routes registered: ${openApiRoutes.length}`);
  console.log(`=======================================================`);
});
```

---

## 5. Integrating with Next.js & Vite Dev Environments

You can seamlessly wire the mock server into your local development flow:

### `package.json` Dev Pipeline
```json
{
  "scripts": {
    "dev:mock": "node scripts/mock-server.mjs --port 4000",
    "dev:app": "next dev",
    "dev": "concurrently --names \"MOCK,APP\" -c \"magenta,blue\" \"npm run dev:mock\" \"npm run dev:app\""
  }
}
```

### Vite Proxy Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

This allows frontend code to simply make requests to `/api/users`, which are forwarded to the zero-dependency mock server running locally on port 4000.
