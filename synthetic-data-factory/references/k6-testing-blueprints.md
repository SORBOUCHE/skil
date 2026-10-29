# Production k6 Testing Blueprints

A comprehensive repository of ready-to-run k6 load testing scripts covering REST APIs, GraphQL endpoints, and WebSockets.

---

## 1. REST API Blueprint (Authentication, Multi-Endpoint User Flow)

```javascript
// rest-user-journey.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Metrics
const apiDuration = new Trend('api_rest_duration', true);
const errorCounter = new Counter('api_rest_errors');
const failureRate = new Rate('api_failure_rate');

export const options = {
  scenarios: {
    steady_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // Ramp-up
        { duration: '2m',  target: 150 }, // Normal load
        { duration: '1m',  target: 300 }, // Peak load
        { duration: '30s', target: 0 },   // Cool-down
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    api_failure_rate: ['rate<0.01'], // Under 1% failures
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.staging.example.com';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'k6-load-benchmark/1.0',
    },
  };

  group('01_User_Authentication', () => {
    const authPayload = JSON.stringify({
      username: `synthetic_user_${__VU}@test.internal`,
      password: 'MockSecurePassword!123',
    });

    const res = http.post(`${BASE_URL}/api/v1/auth/login`, authPayload, params);
    const pass = check(res, {
      'auth status is 200': (r) => r.status === 200,
      'token returned': (r) => r.json('token') !== undefined,
    });

    failureRate.add(!pass);
    if (!pass) {
      errorCounter.add(1);
      return;
    }

    params.headers['Authorization'] = `Bearer ${res.json('token')}`;
  });

  sleep(1);

  let createdResourceId = null;

  group('02_Create_Resource', () => {
    const payload = JSON.stringify({
      title: `Benchmark Task VU ${__VU} Iter ${__ITER}`,
      description: 'Synthetic stress testing item',
      priority: Math.floor(Math.random() * 3) + 1,
      tags: ['synthetic', 'perf-test', 'automated'],
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/v1/tasks`, payload, params);
    apiDuration.add(Date.now() - start);

    const pass = check(res, {
      'create status is 201': (r) => r.status === 201,
      'resource id generated': (r) => r.json('id') !== undefined,
    });

    failureRate.add(!pass);
    if (pass) {
      createdResourceId = res.json('id');
    }
  });

  sleep(1.5);

  group('03_Query_With_Pagination', () => {
    const res = http.get(`${BASE_URL}/api/v1/tasks?limit=25&page=1&sort=desc`, params);
    const pass = check(res, {
      'query status is 200': (r) => r.status === 200,
      'items is an array': (r) => Array.isArray(r.json('items')),
    });
    failureRate.add(!pass);
  });

  if (createdResourceId) {
    sleep(0.5);
    group('04_Delete_Resource_Cleanup', () => {
      const res = http.del(`${BASE_URL}/api/v1/tasks/${createdResourceId}`, null, params);
      check(res, {
        'delete status is 200 or 204': (r) => r.status === 200 || r.status === 204,
      });
    });
  }

  sleep(Math.random() * 2 + 1);
}
```

---

## 2. GraphQL API Blueprint (Queries, Mutations, Variable Injection)

```javascript
// graphql-benchmark.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const gqlDuration = new Trend('graphql_req_duration', true);
const gqlErrors = new Rate('graphql_errors');

export const options = {
  vus: 50,
  duration: '3m',
  thresholds: {
    graphql_req_duration: ['p(95)<250'],
    graphql_errors: ['rate<0.005'], // < 0.5% GraphQL errors
  },
};

const GQL_ENDPOINT = __ENV.GQL_URL || 'https://api.staging.example.com/graphql';

const GET_USER_FEED_QUERY = `
  query GetUserFeed($userId: ID!, $limit: Int!, $offset: Int!) {
    user(id: $userId) {
      id
      username
      feed(limit: $limit, offset: $offset) {
        edges {
          node {
            id
            title
            score
            author {
              id
              displayName
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const POST_COMMENT_MUTATION = `
  mutation PostComment($postId: ID!, $content: String!) {
    addComment(input: { postId: $postId, content: $content }) {
      comment {
        id
        content
        createdAt
      }
      errors {
        code
        message
      }
    }
  }
`;

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${__ENV.GQL_TOKEN || 'test-service-token'}`,
  };

  // 1. Execute Query
  {
    const queryPayload = JSON.stringify({
      query: GET_USER_FEED_QUERY,
      variables: {
        userId: `usr_${Math.floor(Math.random() * 500) + 1}`,
        limit: 15,
        offset: 0,
      },
    });

    const start = Date.now();
    const res = http.post(GQL_ENDPOINT, queryPayload, { headers });
    gqlDuration.add(Date.now() - start);

    const body = res.json();
    const hasGraphQLErrors = body && body.errors && body.errors.length > 0;
    gqlErrors.add(hasGraphQLErrors || res.status !== 200);

    check(res, {
      'gql query status 200': (r) => r.status === 200,
      'gql no response errors': () => !hasGraphQLErrors,
      'gql payload returned': () => body.data && body.data.user !== undefined,
    });
  }

  sleep(1);

  // 2. Execute Mutation
  {
    const mutationPayload = JSON.stringify({
      query: POST_COMMENT_MUTATION,
      variables: {
        postId: `post_${Math.floor(Math.random() * 200) + 1}`,
        content: `Synthetic stress comment at timestamp ${Date.now()}`,
      },
    });

    const start = Date.now();
    const res = http.post(GQL_ENDPOINT, mutationPayload, { headers });
    gqlDuration.add(Date.now() - start);

    const body = res.json();
    const hasGraphQLErrors = body && body.errors && body.errors.length > 0;
    gqlErrors.add(hasGraphQLErrors || res.status !== 200);

    check(res, {
      'gql mutation status 200': (r) => r.status === 200,
      'gql mutation succeeded': () => !hasGraphQLErrors && body.data?.addComment?.comment?.id !== undefined,
    });
  }

  sleep(Math.random() * 2 + 0.5);
}
```

---

## 3. WebSocket Blueprint (Real-Time Bidirectional Messaging)

```javascript
// websocket-load.js
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const wsConnectionTime = new Trend('ws_connect_time', true);
const wsPingPongRTT = new Trend('ws_ping_pong_rtt', true);
const wsMessagesReceived = new Counter('ws_messages_received');
const wsErrors = new Counter('ws_errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Connect 50 sockets
    { duration: '2m',  target: 200 }, // Scale to 200 concurrent WebSockets
    { duration: '1m',  target: 200 }, // Sustain
    { duration: '30s', target: 0 },   // Disconnect
  ],
  thresholds: {
    ws_connect_time: ['p(95)<1000'],
    ws_ping_pong_rtt: ['p(95)<150'],
  },
};

const WS_URL = __ENV.WS_URL || 'wss://streaming.staging.example.com/socket';

export default function () {
  const startConnect = Date.now();

  const response = ws.connect(WS_URL, { headers: { 'X-Synthetic-Client': 'k6' } }, function (socket) {
    wsConnectionTime.add(Date.now() - startConnect);

    socket.on('open', () => {
      // Subscribe to live channel
      socket.send(JSON.stringify({
        action: 'subscribe',
        channel: `market_channel_${Math.floor(Math.random() * 10)}`,
        auth: 'synthetic-ws-token',
      }));

      // Periodic Heartbeat / Ping-Pong
      socket.setInterval(() => {
        const pingTimestamp = Date.now();
        socket.send(JSON.stringify({ action: 'ping', timestamp: pingTimestamp }));
      }, 5000);
    });

    socket.on('message', (data) => {
      wsMessagesReceived.add(1);
      try {
        const parsed = JSON.parse(data);
        if (parsed.action === 'pong') {
          const rtt = Date.now() - parsed.timestamp;
          wsPingPongRTT.add(rtt);
        }
      } catch (err) {
        wsErrors.add(1);
      }
    });

    socket.on('close', () => {
      // Socket cleanly closed
    });

    socket.on('error', (e) => {
      wsErrors.add(1);
      console.error('Socket error encountered:', e.error());
    });

    // VU holds socket connection for 30 seconds
    socket.setTimeout(() => {
      socket.close();
    }, 30000);
  });

  check(response, {
    'ws handshake 101': (r) => r && r.status === 101,
  });

  sleep(1);
}
```

---

## 4. Parameterizing k6 with Synthetic CSV Datasets

When feeding thousands of unique synthetic users, cards, or products into a k6 run:

```javascript
// parameterized-k6.js
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Load synthetic CSV dataset once into shared read-only memory
const testRecords = new SharedArray('synthetic_users', function () {
  return papaparse.parse(open('./synthetic_fixtures.csv'), { header: true }).data;
});

export const options = {
  vus: 20,
  iterations: 1000,
};

export default function () {
  // Deterministically or randomly assign a fixture record to this iteration
  const record = testRecords[__ITER % testRecords.length];

  const payload = JSON.stringify({
    userId: record.user_id,
    email: record.email,
    tier: record.account_tier,
  });

  const res = http.post('https://api.staging.example.com/api/v1/enrich', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'record processed': (r) => r.status === 200,
  });
}
```
