# DevOps Autopilot Agent Rules & Architectural Standards

These rules govern all DevOps, containerization, orchestration, infrastructure-as-code, and observability operations executed by Antigravity agents.

---

## 1. Containerization & Docker Standards

- **Mandatory Multi-Stage Builds**:
  - Always implement multi-stage Dockerfiles separating build dependencies, compilers, and test suites from final runtime environments.
  - Final images must only contain runtime binaries and essential dependencies to minimize image size and surface area for vulnerabilities.
  - Use official, verified base images (prefer minimal images like `alpine`, `distroless`, or language-specific slim variants).

- **Strict Secret Isolation**:
  - NEVER hardcode secrets, API keys, passwords, database credentials, or tokens in Dockerfiles, `.env` files committed to version control, or image metadata.
  - Use Docker BuildKit secret mounts (`--mount=type=secret`) for credentials needed only at build time.
  - Inject runtime credentials strictly via environment variables or secret managers (e.g., Vault, AWS Secrets Manager, GCP Secret Manager).

- **Non-Root Execution & Hardened Security**:
  - Every production container must run as a non-root user (e.g., `USER 10001:10001` or language-specific non-root users like `node`).
  - Set root filesystem to read-only where possible (`read_only: true` in Compose, `readOnlyRootFilesystem: true` in Kubernetes) with writable mounts restricted to `/tmp` or specific cache directories.
  - Drop all unnecessary Linux capabilities (`cap_drop: [ALL]`, only re-adding specific requirements like `NET_BIND_SERVICE` if non-standard ports cannot be used).

- **Mandatory Health Checks**:
  - Every containerized service must define a reliable `HEALTHCHECK` in Dockerfile or compose configuration.
  - Health check scripts must be lightweight and non-blocking, returning exit code 0 on healthy and 1 on failure.

- **Deterministic Version Tagging**:
  - NEVER use the `:latest` tag in production environments or deployment manifests.
  - Base images and produced application images must use explicit semantic versions (e.g., `node:20.11-alpine3.19`) or Git commit SHAs (`myapp:v1.4.2` or `myapp:sha-7b3e21a`).

- **Cache Optimization & `.dockerignore`**:
  - Always create and maintain a comprehensive `.dockerignore` file excluding `.git`, `node_modules`, test artifacts, local cache, build directories, IDE files, and sensitive credentials.
  - Order Dockerfile instructions from least frequently changed to most frequently changed to maximize layer cache hit ratios.

---

## 2. Kubernetes Orchestration Standards

- **Probes are Required for All Workloads**:
  - Every pod must define both `readinessProbe` and `livenessProbe`.
  - Readiness probes must verify downstream readiness before traffic is routed to the pod.
  - Liveness probes must detect unrecoverable application deadlocks and trigger pod restarts.
  - Optionally configure `startupProbe` for applications with long initialization cycles to avoid premature liveness timeouts.

- **Explicit Resource Requests and Limits**:
  - Every container specification must define `resources.requests` (for scheduling guarantees) and `resources.limits` (for noisy-neighbor protection).
  - Set CPU requests based on baseline consumption and memory limits to prevent out-of-memory (OOM) cascades affecting the node.

- **Zero-Downtime Deployment & Rollback Strategy**:
  - Deployments must configure explicit rolling update strategies (`maxSurge` and `maxUnavailable`).
  - Set `minReadySeconds` to ensure pods remain healthy for a warm-up period before considering the step successful.
  - Retain deployment revision history (`revisionHistoryLimit: 10`) to allow instant automated rollbacks (`kubectl rollout undo`).
  - Couple deployments with PodDisruptionBudgets (`PDB`) to guarantee high availability during cluster maintenance and node draining.

- **RBAC & Pod Security Standards (PSS)**:
  - Practice least privilege: do not use the default ServiceAccount for production workloads; create dedicated ServiceAccounts with minimal RBAC RoleBindings.
  - Set `automountServiceAccountToken: false` on ServiceAccounts and Pods unless API server communication is explicitly required.
  - Enforce Pod Security Context: `runAsNonRoot: true`, `runAsUser`, `readOnlyRootFilesystem: true`, and `allowPrivilegeEscalation: false`.

- **Kubernetes Secret Management**:
  - Never commit raw Kubernetes Secrets to source control.
  - Use External Secrets Operator, Sealed Secrets, HashiCorp Vault integration, or cloud-native secret providers.

---

## 3. Infrastructure as Code (IaC) Standards

- **No Manual Console Clicks (ClickOps Prohibited)**:
  - 100% of cloud resources, networking, IAM permissions, and storage must be declared in version-controlled IaC (Terraform, OpenTofu, or Pulumi).
  - Manual changes made directly in cloud consoles are strictly prohibited to eliminate configuration drift.

- **Remote State & State Locking**:
  - Terraform state files must never be stored locally or checked into Git.
  - Always configure secure remote state backends (AWS S3 + DynamoDB locking, Google Cloud Storage, or Azure Blob Storage) with encryption at rest and bucket versioning enabled.

- **Modular Architecture & Environment Isolation**:
  - Structure IaC using reusable, parameterized modules (VPC, EKS/GKE, Database, Load Balancer).
  - Strictly isolate environments (`dev`, `staging`, `prod`) using separate state files, directories, or dedicated cloud accounts/projects to prevent blast radius overlap.

- **Automated CI/CD Validation**:
  - CI pipelines must run `terraform fmt -check`, `tflint`, and security scanners (`tfsec` / `checkov`) on every commit.
  - PR workflows must generate speculative plans (`terraform plan`), and changes must only be applied automatically or after explicit approval upon merging to the protected branch.

---

## 4. Security & Least Privilege

- **IAM and Cloud Permissions**:
  - Grant only the minimum permissions required for specific workloads (Least Privilege principle).
  - Avoid wildcard (`"*"`) actions and resources in IAM policies.
  - Use IAM Roles for Service Accounts (IRSA on AWS, Workload Identity on GCP) rather than static long-lived credentials.

- **Network Isolation**:
  - Databases, caches, and internal services must always reside in private subnets with no public IP addresses.
  - Apply Kubernetes NetworkPolicies to restrict pod-to-pod communication to only authorized service dependencies.

---

## 5. Observability & SRE Standards

- **The Golden Signals & Observability Pillars**:
  - Every production service must export metrics (Latency, Traffic, Errors, Saturation), structured JSON logs, and distributed traces.
  - Expose `/metrics` in standard Prometheus text format.
  - Define actionable alerting rules targeting symptoms affecting Service Level Objectives (SLOs), not transient machine anomalies.
