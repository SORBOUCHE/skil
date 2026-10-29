---
name: kubernetes-navigator
description: Expert Kubernetes architect for crafting production manifests, zero-downtime rolling deployments, autoscaling policies, Helm packaging, and pod security hardening.
---

# Kubernetes Navigator Skill

This skill guides Antigravity in generating, validating, refactoring, and troubleshooting cloud-native Kubernetes workloads, networking, autoscaling, and storage architectures.

---

## 1. When to Activate

Activate this skill whenever the user:
- Requests Kubernetes deployment manifests (`Deployment`, `StatefulSet`, `DaemonSet`, `Job`).
- Needs network configuration via Kubernetes `Service`, `Ingress`, or `Gateway API`.
- Asks for autoscaling strategies (`HorizontalPodAutoscaler`, `KEDA`, `VerticalPodAutoscaler`).
- Wants to package microservices into Helm charts or Kustomize overlays.
- Faces pod failures (`CrashLoopBackOff`, `OOMKilled`, `ImagePullBackOff`, `Pending`).
- Requires workload security hardening (Pod Security Standards, RBAC, NetworkPolicies).
- Prepares applications for zero-downtime deployments with rolling update strategies and graceful shutdown hooks.

---

## 2. Core Kubernetes Workload & Network Resources

### Workload Resources
- **Deployment**: Declarative updates for stateless applications. Manages ReplicaSets and supports rollouts, pause, resume, and instant rollbacks.
- **StatefulSet**: Manages stateful applications requiring unique network identities, ordered deployment/scaling, and persistent storage per replica.
- **DaemonSet**: Ensures all (or some) nodes run a copy of a pod (ideal for log collectors like Fluentbit or node exporters).
- **Job / CronJob**: Manages short-lived, batch, or recurring tasks until successful completion.

### Network Resources
- **Service (ClusterIP)**: Exposes the service on a cluster-internal IP. Default choice for internal microservice communication.
- **Service (NodePort)**: Exposes the service on each node’s IP at a static port (`30000-32767`). Used behind external load balancers or edge nodes.
- **Service (LoadBalancer)**: Provisions a native cloud provider load balancer (e.g., AWS NLB, GCP Cloud Load Balancing) routing directly to the service.
- **Ingress**: Manages external HTTP/HTTPS access to services, routing rules, TLS termination, and host/path-based routing.

### Configuration & Storage
- **ConfigMap**: Decouples configuration artifacts, environment flags, and configuration files from container image binaries.
- **Secret**: Holds sensitive parameters (passwords, tokens, certificates). Should be encrypted at rest and mounted as memory-backed files.
- **PersistentVolumeClaim (PVC)**: Declarative request for storage consumed by a Pod, backed by dynamically provisioned PersistentVolumes (PVs).

---

## 3. Production Hardening Patterns

### Horizontal Pod Autoscaler (HPA)
Autoscales replica counts based on observed CPU utilization, memory pressure, or custom Prometheus metrics:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```

### Pod Disruption Budget (PDB)
Guarantees high availability during voluntary disruptions (node drains, cluster upgrades, auto-repair):
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-api-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: web-api
```

### Network Policies (Zero Trust Micro-Segmentation)
Isolates workloads so that pods only accept traffic from authorized sources:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-ingress-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: web-api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to: # CoreDNS lookup
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

---

## 4. Probes: Readiness, Liveness, and Startup

| Probe Type | Purpose | Failure Action | When to Use |
| :--- | :--- | :--- | :--- |
| **Startup Probe** | Detects when slow-starting apps are fully initialized | Kills container and restarts it according to restartPolicy | Java/Spring Boot or apps requiring database schema migrations on start |
| **Readiness Probe** | Determines if the pod is ready to accept incoming user traffic | Removes pod IP from the Service endpoints (no restarts) | When service has dependencies, cache warmup, or temporary overload |
| **Liveness Probe** | Detects deadlocks, zombie threads, or hung states | Kills container and triggers immediate restart | When app enters an unrecoverable hung state |

```yaml
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 2
  failureThreshold: 3
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

---

## 5. Zero-Downtime Rolling Updates

Configure the Deployment's `strategy` block to ensure continuous service availability:
```yaml
spec:
  replicas: 4
  minReadySeconds: 15 # Wait 15s after readiness probe passes before moving to next pod
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%       # At most 25% extra pods created during update
      maxUnavailable: 0   # 0% of pods can be down during the rollout
```

### Graceful Termination Lifecycle Hooks
To avoid dropped in-flight requests while the endpoint list updates in iptables/ipvs:
```yaml
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 15"]
terminationGracePeriodSeconds: 45
```

---

## 6. Helm Chart Structure & Packaging

A standard production Helm 3 chart structure:
```text
my-service-chart/
├── Chart.yaml              # Chart metadata (name, version, appVersion)
├── values.yaml             # Default configuration values
├── values-prod.yaml        # Production override values
├── .helmignore             # Files ignored during chart packaging
└── templates/
    ├── _helpers.tpl        # Reusable Go template helper functions
    ├── deployment.yaml     # Application deployment
    ├── service.yaml        # Service definition
    ├── ingress.yaml        # Ingress routing
    ├── hpa.yaml            # Horizontal Pod Autoscaler
    ├── pdb.yaml            # Pod Disruption Budget
    ├── serviceaccount.yaml # RBAC Service Account
    └── NOTES.txt           # Post-install message
```

---

## 7. Security: RBAC & Pod Security Context

Production workloads must enforce strict security boundaries:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-service-account
  namespace: production
automountServiceAccountToken: false
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-api
  namespace: production
spec:
  template:
    spec:
      serviceAccountName: api-service-account
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        runAsGroup: 10001
        fsGroup: 10001
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: myregistry.io/app:v1.4.2
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
```

---

## 8. Complete Production Web Application Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: production-web-api
  namespace: production
  labels:
    app.kubernetes.io/name: web-api
    app.kubernetes.io/instance: prod
    app.kubernetes.io/version: "1.4.2"
spec:
  replicas: 3
  minReadySeconds: 10
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: web-api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web-api
    spec:
      serviceAccountName: web-api-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        runAsGroup: 10001
        fsGroup: 10001
      containers:
        - name: web-api
          image: myregistry.azurecr.io/web-api:1.4.2
          imagePullPolicy: IfNotPresent
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 15
            periodSeconds: 10
          volumeMounts:
            - name: tmp-dir
              mountPath: /tmp
      volumes:
        - name: tmp-dir
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: production-web-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: web-api
  ports:
    - name: http
      port: 80
      targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: production-web-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls-cert
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: production-web-service
                port:
                  number: 80
```

---

## 9. Kubectl Diagnostic Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Inspect Pod State** | `kubectl describe pod <pod-name> -n <namespace>` |
| **Stream Live Logs** | `kubectl logs -f <pod-name> -c <container> -n <namespace>` |
| **Check Previous Crash Logs** | `kubectl logs -p <pod-name> -c <container> -n <namespace>` |
| **Execute Debug Shell** | `kubectl exec -it <pod-name> -n <namespace> -- /bin/sh` |
| **Port Forward to Localhost** | `kubectl port-forward svc/<service-name> 8080:80 -n <namespace>` |
| **Check Resource Consumption** | `kubectl top pods -n <namespace> --sort-by=cpu` |
| **Track Rollout Status** | `kubectl rollout status deployment/<deployment-name> -n <namespace>` |
| **Instant Rollback** | `kubectl rollout undo deployment/<deployment-name> -n <namespace>` |
| **Ephemeral Debug Container** | `kubectl debug -it <pod-name> --image=nicolaka/netshoot --target=<container>` |
