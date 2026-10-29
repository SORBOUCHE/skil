#!/usr/bin/env node
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

  // Fallback route
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
