---
name: stress-test-orchestrator
description: Comprehensive orchestrator for authoring, executing, and analyzing k6, autocannon, and Artillery load and stress tests with strict SLA thresholds and saturation detection.
---

# Stress-Test Orchestrator: Load & Performance Engineering Guide

The `stress-test-orchestrator` skill automates the authoring, execution, and metric analysis of high-throughput load and stress tests using **k6**, **autocannon**, and **Artillery**. It guides engineers in establishing rigorous Service Level Objectives (SLOs), pinpointing saturation knee points, and catching performance regressions before code reaches production.

---

## 1. Load Testing Taxonomy

Understanding test topologies ensures the right workload profile is executed:

```
[Smoke Test]     -> 1-5 VUs, 1 min: Validate configuration, credentials, and endpoint uptime.
[Load Test]      -> Expected peak traffic (e.g. 100-300 VUs) for 15-30 mins: Validate p95/p99 latency against SLOs.
[Stress Test]    -> 150-300% of peak traffic until system saturates: Identify breaking point and failure modes.
[Spike Test]     -> Sudden surge from 0 to 1,000+ VUs in seconds: Verify auto-scaling, rate limiters, and circuit breakers.
[Soak Test]      -> Moderate traffic (60-80% capacity) for 8-24 hours: Detect memory leaks and connection exhaustion.
```

---

## 2. Framework Comparison: k6 vs. autocannon vs. Artillery

| Feature | Grafana k6 | Autocannon | Artillery |
|---|---|---|---|
| **Runtime** | Go-based JS engine (goja) | Pure Node.js (fastest Node bench) | Node.js engine |
| **Best For** | Complex user journeys, multi-protocol (HTTP, WS, gRPC) | Ultra-fast single endpoint micro-benchmarking | YAML-driven multi-step scenario simulation |
| **Resource Efficiency** | Extremely high (thousands of VUs per core) | High (leverages libuv pipelining) | Moderate |
| **Scripting Language** | Modern ES6 JavaScript / TypeScript | JavaScript / Node.js API & CLI | YAML + JavaScript helper functions |
| **Built-in Assertions** | Thresholds (`p(95)<200`, `rate<0.01`) | Boolean exit codes & CLI stats | Ensure / thresholds syntax |
| **Metrics & Telemetry** | InfluxDB, Prometheus, Datadog, Grafana Cloud | Terminal summary, JSON streams | Datadog, Splunk, Honeycomb, CloudWatch |

---

## 3. k6 Load Testing Architecture

### 3.1 Lifecycle Stages & Test Execution Flow
Every k6 test executes through four lifecycle functions:

1. **`setup()` (Once)**: Runs before any VU starts. Fetches auth tokens, creates test tenants, or preloads fixtures.
2. **`default function(data)` (Concurrent VUs)**: Executed repeatedly by all Virtual Users across configured stages.
3. **`teardown(data)` (Once)**: Runs after all VUs terminate. Cleans up test artifacts and purges synthetic records.
4. **`handleSummary(data)` (Optional)**: Transforms test results into custom JUnit, JSON, or HTML reports.

### 3.2 Defining Performance Thresholds & SLAs
Thresholds act as pass/fail criteria for CI/CD pipelines. If any threshold fails, k6 exits with non-zero status code:

```javascript
export const options = {
  thresholds: {
    // 95% of requests must complete under 200ms, 99% under 500ms
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    // Less than 1% of total requests may fail
    http_req_failed: ['rate<0.01'],
    // Custom transaction metric: checkout duration p95 under 800ms
    'transaction_duration{type:checkout}': ['p(95)<800'],
    // Minimum throughput requirement: at least 300 requests per second
    http_reqs: ['rate>300'],
  },
};
```

---

## 4. Production k6 Stress Script Blueprint

The following production script implements staged ramp-up, synthetic payload randomization, custom metrics, authentication headers, and strict error handling:

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom Metrics
const checkoutDuration = new Trend('checkout_duration', true);
const errorRate = new Rate('api_error_rate');
const successfulOrders = new Counter('successful_orders');

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Warm-up ramp
    { duration: '1m',  target: 100 },  // Normal baseline load
    { duration: '2m',  target: 250 },  // High load
    { duration: '1m',  target: 500 },  // Extreme stress peak
    { duration: '1m',  target: 500 },  // Hold at peak
    { duration: '45s', target: 0 },    // Graceful cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<350', 'p(99)<750'],
    http_req_failed: ['rate<0.01'],
    api_error_rate: ['rate<0.01'],
    checkout_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://staging-api.internal.local';

// Setup phase: authenticate once and share token
export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/service-token`, JSON.stringify({
    clientId: __ENV.CLIENT_ID || 'synthetic-perf-runner',
    clientSecret: __ENV.CLIENT_SECRET || 'secret-benchmark-token'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const authToken = loginRes.json('access_token') || 'mock-jwt-token-xyz';
  return { token: authToken };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
    'X-Synthetic-Test': 'true'
  };

  group('Browse Products Catalog', () => {
    const page = Math.floor(Math.random() * 5) + 1;
    const res = http.get(`${BASE_URL}/api/v1/products?page=${page}&limit=20`, { headers });

    const ok = check(res, {
      'catalog status is 200': (r) => r.status === 200,
      'catalog response has items': (r) => r.json('data.items.length') > 0,
    });
    errorRate.add(!ok);
  });

  sleep(Math.random() * 1.5 + 0.5); // Think time 500ms - 2000ms

  group('Create Order Transaction', () => {
    const payload = JSON.stringify({
      customerId: `usr_${Math.floor(Math.random() * 10000)}`,
      items: [
        { productId: `prod_${Math.floor(Math.random() * 50) + 1}`, quantity: Math.floor(Math.random() * 3) + 1 },
      ],
      paymentMethod: 'synthetic_stripe_token'
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/v1/orders`, payload, { headers });
    checkoutDuration.add(Date.now() - start);

    const ok = check(res, {
      'order status is 201': (r) => r.status === 201,
      'order confirmation present': (r) => r.json('orderId') !== undefined,
    });

    errorRate.add(!ok);
    if (ok) successfulOrders.add(1);
  });

  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  // Optional cleanup hooks
  console.log('Load test completed. Purging temporary test reservations.');
}
```

---

## 5. autocannon: High-Throughput Node.js Micro-Benchmarking

When testing individual Node.js/Express/Fastify endpoints for maximum raw RPS and connection concurrency:

### 5.1 Programmatic Autocannon Runner Script
```javascript
// benchmark-autocannon.js
import autocannon from 'autocannon';

async function runBenchmark() {
  console.log('🚀 Launching autocannon benchmark against target API...');

  const result = await autocannon({
    url: process.env.TARGET_URL || 'http://localhost:3000/api/v1/health',
    connections: 100,        // Concurrent open TCP connections
    pipelining: 10,          // HTTP pipelining factor
    duration: 30,            // Duration in seconds
    headers: {
      'x-perf-bench': 'autocannon',
      'authorization': 'Bearer synthetic-token'
    },
    requests: [
      {
        method: 'POST',
        path: '/api/v1/telemetry/events',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'ping', timestamp: Date.now() })
      }
    ]
  });

  console.log('\n📊 Benchmark Completed:');
  console.log(`Throughput: ${result.requests.average} req/sec`);
  console.log(`Latency p50: ${result.latency.p50} ms`);
  console.log(`Latency p95: ${result.latency.p95} ms`);
  console.log(`Latency p99: ${result.latency.p99} ms`);
  console.log(`Total 2xx: ${result['2xx']}, 5xx Errors: ${result['5xx']}`);

  // Threshold assertion
  if (result.latency.p95 > 150) {
    console.error('❌ SLA VIOLATION: p95 latency exceeded 150ms limit!');
    process.exit(1);
  }
  if (result.errors > 0 || result['5xx'] > 0) {
    console.error('❌ FAILURE: Non-zero error rate observed!');
    process.exit(1);
  }

  console.log('✅ SLA PASSED: Performance within target bounds.');
}

runBenchmark();
```

---

## 6. Artillery Multi-Step Scenario Testing

Artillery excels in declarative YAML test scenarios simulating user journey flows:

```yaml
# artillery-scenario.yml
config:
  target: "https://staging-api.internal.local"
  phases:
    - duration: 60
      arrivalRate: 5
      rampTo: 50
      name: "Ramp up to 50 users/sec"
    - duration: 180
      arrivalRate: 50
      name: "Sustained peak load"
  ensure:
    p95: 250
    p99: 600
    maxErrorRate: 1

scenarios:
  - name: "Guest User Browsing Flow"
    weight: 70
    flow:
      - get:
          url: "/api/v1/categories"
      - think: 2
      - get:
          url: "/api/v1/search?q=synthetic"

  - name: "Checkout Purchase Journey"
    weight: 30
    flow:
      - post:
          url: "/api/v1/cart/items"
          json:
            productId: "item-109"
            quantity: 2
          capture:
            json: "$.cartId"
            as: "cartId"
      - think: 1
      - post:
          url: "/api/v1/cart/{{ cartId }}/checkout"
          json:
            shippingTier: "express"
```

---

## 7. Identifying Saturation Limits & Bottlenecks

### 7.1 Little's Law & The Saturation Knee Point
$$\text{Concurrency } (L) = \text{Throughput } (\lambda) \times \text{Response Time } (W)$$

When plotting Concurrency against Throughput and Latency:
1. **Linear Zone**: As concurrency increases, throughput (RPS) scales linearly while response time remains flat.
2. **Knee Point (Maximum Capacity)**: Throughput plateaus at system capacity limit.
3. **Queueing & Degradation Zone**: Additional concurrency no longer increases throughput; requests queue up, causing response times to skyrocket exponentially.
4. **Failure Zone**: Cascading timeouts, HTTP 503 / 504 errors, connection resets.

```
Throughput (RPS)              Response Time (ms)
      ▲                              ▲
      │        /───────── (Knee)     │                / (Degradation)
      │       /                      │               /
      │      /                       │              /
      │     /                        │  ───────────/ (Flat until Knee)
      └─────────────────────►        └─────────────────────►
           Concurrency (VUs)              Concurrency (VUs)
```

### 7.2 Root Cause Diagnostic Matrix

| Observed Symptom | Primary Suspect | Remediation / Tuning |
|---|---|---|
| Latency jumps abruptly at specific VU count | Database Connection Pool Starvation | Increase pool size (`max_connections`, PgBouncer pool), shorten idle timeouts. |
| Memory usage climbs monotonically during soak test | Node.js / Go memory leak | Inspect heap snapshots, unclosed file descriptors, event listener leaks. |
| High CPU on database, low app CPU | Missing DB indexes or N+1 queries | Add missing compound indexes, batch queries (`DataLoader`, Prisma `include`). |
| High p99 spikes with low average latency | Stop-the-world Garbage Collection pauses | Tune JVM/Node GC flags, reduce ephemeral object allocations in request paths. |
| HTTP 502 / 504 Bad Gateway | Reverse proxy / Ingress timeout | Increase upstream keep-alive timeouts in Nginx/Envoy, tune backlog queues. |

---

## 8. Automated CI/CD Regression Workflow

Automate performance regression testing in GitHub Actions:

```yaml
name: Performance & Stress Regression
on:
  pull_request:
    branches: [main]

jobs:
  k6-benchmark:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Launch Local Test Server
        run: |
          npm ci
          npm run build
          npm run start:test &
          npx wait-on http://localhost:3000/api/health -t 30000

      - name: Execute k6 Stress Test
        env:
          TARGET_URL: http://localhost:3000
        run: |
          k6 run --out json=results.json tests/performance/stress-test.js

      - name: Archive Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-performance-report
          path: results.json
```
