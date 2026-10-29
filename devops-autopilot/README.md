# DevOps Autopilot Antigravity Plugin
# إضافة الطيار الآلي للعمليات البرمجية (DevOps Autopilot)

[![Antigravity Plugin](https://img.shields.io/badge/Antigravity-Plugin-blue.svg)](https://github.com)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](https://github.com)

---

## 🌍 English Overview

**DevOps Autopilot** transforms Antigravity into a dedicated, enterprise-grade Senior DevOps & Site Reliability Engineer (SRE). It enables developers and teams to go from raw code to resilient, production-ready cloud deployments without requiring a separate DevOps team.

The plugin provides end-to-end expertise across containerization, Kubernetes orchestration, Infrastructure-as-Code (Terraform & Pulumi), and full-stack observability (Prometheus, Grafana, Alertmanager).

---

## 🇸🇦 نظرة عامة باللغة العربية

تحول إضافة **DevOps Autopilot (الطيار الآلي للعمليات البرمجية)** منصة Antigravity إلى مهندس DevOps ومهندس موثوقية مواقع (SRE) محترف ومتقدم. تُمكّن الإضافة المطورين والفرق البرمجية من نقل مشاريعهم وتطبيقاتهم من مجرد كود برمجي محلي إلى بيئات إنتاج سحابية آمنة وعالية الأداء دون الحاجة إلى الاستعانة بفريق DevOps خارجي منفصل.

تغطي الإضافة دورة حياة النشر السحابي بالكامل: الحاويات (Docker)، تنسيق الحاويات عبر (Kubernetes)، البنية التحتية كرمز برمجـي (Terraform / Pulumi)، ومنظومة المراقبة والإنذارات الاستباقية (Prometheus & Grafana).

---

## 🚀 Key Skills Included / المهارات الأساسية المضمنة

### 1. `docker-expert` (خبير دوكر والحاويات)
- **Multi-Stage Builds**: Creates ultra-lightweight, high-speed multi-stage Dockerfiles for Node.js, Python, Go, Java, and Flutter Web.
- **Security Hardening**: Enforces rootless execution (`USER nonroot`), read-only root filesystems, drops Linux capabilities, and uses minimal base images (`distroless`, `alpine`).
- **Production Docker Compose**: Microservice composition with health check conditions, isolated networks, volume persistence, and resource bounds.
- **Image Optimization**: Maximizes BuildKit cache mounts and enforces strict `.dockerignore` filters.

### 2. `kubernetes-navigator` (قائد كوبرنيتيس)
- **Production Workloads**: Generates robust `Deployment`, `StatefulSet`, `DaemonSet`, `Job`, and `CronJob` specifications.
- **Traffic Routing**: Configures `ClusterIP`, `NodePort`, `LoadBalancer`, and TLS-secured `Ingress` with cert-manager.
- **Zero-Downtime Releases**: Configures rolling update strategies (`maxSurge`, `maxUnavailable`, `minReadySeconds`) and graceful shutdown lifecycle hooks.
- **Resilience & Scaling**: Automated scaling via `HorizontalPodAutoscaler (HPA v2)` and cluster protection via `PodDisruptionBudget (PDB)`.
- **Security & RBAC**: Least-privilege ServiceAccounts, Pod Security Standards, and zero-trust `NetworkPolicy` micro-segmentation.
- **Helm & Packaging**: Ready-to-deploy Helm 3 templates, values separation, and helpers.

### 3. `infra-as-code` (البنية التحتية ككود)
- **Terraform & OpenTofu Architecture**: Modular directory layouts (`environments/`, `modules/`) separating dev, staging, and production state.
- **Remote State Locking**: Configures AWS S3 + DynamoDB locking or GCP Cloud Storage backends.
- **Multi-Cloud Capabilities**: AWS (VPC, EKS, RDS Aurora, ALB) and GCP (VPC, GKE Autopilot, Cloud SQL).
- **Pulumi Integration**: First-class support for TypeScript and Python IaC implementations.
- **CI/CD Governance**: Automated linting (`tflint`), security scanning (`checkov`/`tfsec`), and PR speculative plans.

### 4. `monitoring-setup` (منظومة المراقبة والاستشعار SRE)
- **The Three Pillars**: Complete observability covering Metrics (Prometheus), Logs (Loki), and Traces (OpenTelemetry/Jaeger).
- **The 4 Golden Signals**: Proactive alerting on Latency (p50/p95/p99), Traffic, Error Rate, and Saturation.
- **Alertmanager Routing**: Multi-channel alert dispatching to Slack, PagerDuty, and Webhooks with intelligent deduplication and inhibition.
- **Grafana Provisioning**: Automated datasource and dashboard YAML provisioning (Node Exporter, Kubernetes, Databases).
- **Application Instrumentation**: Out-of-the-box `/metrics` setup for Node.js (`prom-client`), Python (`prometheus-client`), and Go.

---

## 💡 Example Prompts / أمثلة لأوامر الاستخدام

### English Prompts
```text
"Write a production-ready multi-stage Dockerfile and docker-compose for my FastAPI app with PostgreSQL, Redis, health checks, and non-root security hardening."

"Create Kubernetes manifests for my web application including Deployment with rolling update, ClusterIP Service, Nginx Ingress with Let's Encrypt TLS, and HPA."

"Provision an AWS EKS cluster with VPC, private subnets, and an Aurora PostgreSQL database using modular Terraform with remote S3 state."

"Set up a complete monitoring stack in docker-compose with Prometheus, Grafana, Alertmanager, and Node Exporter with alerts for HTTP 5xx errors."
```

### أوامر باللغة العربية
```text
"قم بإنشاء Dockerfile متعدد المراحل (Multi-stage) مع docker-compose كامل لتطبيق NestJS وقاعدة بيانات PostgreSQL، مع تفعيل فحص الصحة (Health Checks) وتشغيل الحاوية بمستخدم غير جذري (non-root)."

"أنشئ ملفات Kubernetes متكاملة للإنتاج (Deployment مع Rolling Update، وService، وIngress مع شهادة SSL مجانية، وHPA للتحجيم التلقائي حسب استهلاك المعالج)."

"صمم بنية تحتية سحابية كاملة على AWS باستخدام Terraform تتضمن شبكة VPC مخصصة، وعنقود EKS، وقاعدة بيانات RDS مدعومة بحفظ الحالة البعيدة (Remote State)."

"جهز منظومة مراقبة متكاملة باستخدام Prometheus وGrafana مع تنبيهات تلقائية على Slack في حال ارتفاع معدل الأخطاء أو بطء الاستجابة."
```

---

## 📁 Plugin Architecture / هيكلية ملفات الإضافة

```text
devops-autopilot/
├── plugin.json                                                # Plugin metadata & suggested prompts
├── README.md                                                  # Bilingual documentation & usage guide
├── rules/
│   └── AGENTS.md                                              # Strict DevOps, IaC, and SRE operating rules
└── skills/
    ├── docker-expert/
    │   ├── SKILL.md                                           # Comprehensive containerization playbook
    │   └── references/
    │       └── dockerfile-patterns.md                         # Ready-to-copy hardened Dockerfiles
    ├── kubernetes-navigator/
    │   ├── SKILL.md                                           # Orchestration & cluster management guide
    │   └── references/
    │       └── k8s-manifest-templates.md                      # Production Kubernetes YAML manifests
    ├── infra-as-code/
    │   └── SKILL.md                                           # Terraform & Pulumi cloud infrastructure guide
    └── monitoring-setup/
        └── SKILL.md                                           # Prometheus, Grafana, and SRE alerting setup
```

---

## 🛠️ Installation / التثبيت

To copy and activate the plugin into your Antigravity plugins directory:

```powershell
Copy-Item -Path "e:\اضافات جيميناي\devops-autopilot" -Destination "C:\Users\Admin\.gemini\config\plugins\devops-autopilot" -Recurse -Force
```

---

## 📄 License

Distributed under the MIT License. Open for personal and enterprise DevOps automation.
