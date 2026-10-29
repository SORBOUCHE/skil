---
name: monitoring-setup
description: Observability and SRE specialist configuring Prometheus, Grafana, Alertmanager, distributed tracing, structured logging, and Golden Signal alerts.
---

# Monitoring & Observability Setup Skill

This skill empowers Antigravity to architect, deploy, and fine-tune comprehensive monitoring, alerting, and observability stacks for microservices, container workloads, and cloud infrastructure.

---

## 1. When to Activate

Activate this skill whenever the user:
- Requests monitoring, metrics collection, structured logging, or distributed tracing.
- Wants to set up Prometheus, Grafana, Alertmanager, or OpenTelemetry.
- Needs application instrumentation (`/metrics` endpoint in Node.js, Python, Go, Java).
- Asks for Service Level Objectives (SLOs), Service Level Indicators (SLIs), and alert rule definitions.
- Requests Grafana dashboard provisioning (Node Exporter, Kubernetes cluster health, application throughput/latency).
- Desires all-in-one Docker Compose observability stacks.
- Wants comparison with cloud-native monitoring (AWS CloudWatch, GCP Cloud Monitoring, Azure Monitor).

---

## 2. The Three Pillars of Observability

1. **Metrics (Numeric Timeseries Data)**:
   - Quantifiable aggregations measured over intervals (Counters, Gauges, Histograms, Summaries).
   - Core Tooling: **Prometheus**, VictoriaMetrics, Thanos, Cortex.
2. **Logs (Structured Contextual Events)**:
   - Time-stamped JSON records describing point-in-time discrete events with trace IDs.
   - Core Tooling: **Grafana Loki**, Fluentbit, Vector, ElasticSearch / Logstash / Kibana (ELK).
3. **Traces (Distributed Request Flow)**:
   - End-to-end propagation of request contexts across microservice boundaries.
   - Core Tooling: **OpenTelemetry (OTel)**, Jaeger, Grafana Tempo.

---

## 3. Prometheus Architecture & Configuration

Prometheus scrapes metrics over HTTP at declared intervals.

### `prometheus.yml` Configuration
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: "app-services"
    scrape_interval: 10s
    metrics_path: "/metrics"
    static_configs:
      - targets: ["api_service:3000"]
```

### Alerting Rules (`alert_rules.yml`)
```yaml
groups:
  - name: application_alerts
    rules:
      - alert: HighHttpErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m])) * 100 > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP 5xx error rate detected on {{ $labels.job }}"
          description: "Error rate is {{ $value | printf \"%.2f\" }}% (> 5% threshold) for the last 5 minutes."

      - alert: ServiceLatencyHigh
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1.0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile latency exceeds 1s on {{ $labels.job }}"
          description: "p95 latency is currently {{ $value | printf \"%.2f\" }}s."
```

---

## 4. Alertmanager Routing & Notifications

Alertmanager handles alert deduplication, grouping, silencing, and notification routing to Slack, PagerDuty, or Webhooks.

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ["alertname", "cluster", "service"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: "slack-notifications"
  routes:
    - match:
        severity: critical
      receiver: "pagerduty-high-priority"

inhibit_rules:
  - source_match:
      severity: "critical"
    target_match:
      severity: "warning"
    equal: ["alertname", "service"]

receivers:
  - name: "slack-notifications"
    slack_configs:
      - channel: "#alerts-devops"
        api_url: "https://hooks.slack.com/services/T00/B00/X00"
        send_resolved: true
        title: '{{ template "slack.default.title" . }}'
        text: '{{ template "slack.default.text" . }}'

  - name: "pagerduty-high-priority"
    pagerduty_configs:
      - service_key: "<PAGERDUTY_INTEGRATION_KEY>"
        send_resolved: true
```

---

## 5. Grafana Dashboard Provisioning

Avoid manual dashboard creation. Automatically provision data sources and dashboard files using YAML:

### `provisioning/datasources/prometheus.yml`
```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

### `provisioning/dashboards/dashboards.yml`
```yaml
apiVersion: 1
providers:
  - name: "Default"
    orgId: 1
    folder: "Production"
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards/json
```

Key community dashboard IDs for instant import:
- **Node Exporter Full**: `1860`
- **Kubernetes Cluster Monitoring**: `315`
- **Nginx Ingress Controller**: `9614`
- **PostgreSQL Database**: `9628`

---

## 6. Application Instrumentation Examples

### A. Node.js (`prom-client`)
```javascript
const express = require('express');
const client = require('prom-client');

const app = express();
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

### B. Python (`prometheus-client` with FastAPI)
```python
from fastapi import FastAPI, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time

app = FastAPI()

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP Requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP latency', ['endpoint'])

@app.middleware("http")
async def monitor_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path, status=response.status_code).inc()
    REQUEST_LATENCY.labels(endpoint=request.url.path).observe(duration)
    return response

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
```

---

## 7. Golden Signals & SLI/SLO Engineering

Every site reliability plan must focus on the 4 Golden Signals:
1. **Latency**: Request round-trip time. Track **p50** (median), **p95**, and **p99** to detect long-tail user pain.
2. **Traffic**: Demand placed upon the system (HTTP Requests Per Second / Transactions Per Second).
3. **Errors**: Failed requests (explicit 5xx errors or implicit corrupt responses). Target: `< 0.1%` error budget.
4. **Saturation**: System fullness (CPU usage %, Memory consumption %, connection pool saturation).

---

## 8. Complete Observability Docker-Compose Stack

All-in-one stack running Prometheus, Grafana, Alertmanager, and Node Exporter:

```yaml
version: "3.8"

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

services:
  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: prometheus
    restart: unless-stopped
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--web.console.libraries=/usr/share/prometheus/console_libraries"
      - "--web.console.templates=/usr/share/prometheus/consoles"
      - "--web.enable-lifecycle"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alert_rules.yml:/etc/prometheus/alert_rules.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:v0.27.0
    container_name: alertmanager
    restart: unless-stopped
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager_data:/alertmanager
    ports:
      - "9093:9093"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:10.4.1
    container_name: grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin_secure_password
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    restart: unless-stopped
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - "--path.procfs=/host/proc"
      - "--path.rootfs=/rootfs"
      - "--path.sysfs=/host/sys"
      - "--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)"
    ports:
      - "9100:9100"
    networks:
      - monitoring
```

---

## 9. Cloud-Native Observability Comparison

| Feature | Open-Source (Prometheus + Grafana) | AWS CloudWatch | GCP Cloud Monitoring |
| :--- | :--- | :--- | :--- |
| **Vendor Lock-in** | Zero (run anywhere) | High (AWS specific) | High (GCP specific) |
| **Query Language** | PromQL (highly expressive) | CloudWatch Insights / Metric Math | MQL (Monitoring Query Lang) |
| **Cost Model** | Infrastructure & storage cost | Pay-per-metric, log ingestion, alarm | Pay-per-MiB logs and custom metrics |
| **Multi-Cloud** | Native (aggregates any source) | Requires agents and custom ingestion | Requires agents / hybrid interconnect |
| **Dashboards** | Grafana (rich visualization, community) | Native dashboards (functional, basic) | Cloud Monitoring dashboards |
