# Production Kubernetes Manifest Templates

A collection of battle-tested, modular Kubernetes YAML resource definitions.

---

## 1. Production Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-api-deployment
  namespace: production
  labels:
    app.kubernetes.io/name: web-api
    app.kubernetes.io/part-of: core-platform
    app.kubernetes.io/component: backend
    app.kubernetes.io/version: "1.4.2"
spec:
  replicas: 3
  revisionHistoryLimit: 10
  minReadySeconds: 15
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: web-api
  template:
    metadata:
      labels:
        app.kubernetes.io/name: web-api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "8080"
    spec:
      serviceAccountName: web-api-sa
      terminationGracePeriodSeconds: 60
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        runAsGroup: 10001
        fsGroup: 10001
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: web-api
          image: myregistry.io/apps/web-api:1.4.2
          imagePullPolicy: IfNotPresent
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          envFrom:
            - configMapRef:
                name: web-api-config
            - secretRef:
                name: web-api-secrets
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi
          startupProbe:
            httpGet:
              path: /health/startup
              port: http
            failureThreshold: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 2
            successThreshold: 1
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 15
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
          volumeMounts:
            - name: tmp-volume
              mountPath: /tmp
      volumes:
        - name: tmp-volume
          emptyDir: {}
```

---

## 2. ClusterIP Service Manifest

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-api-service
  namespace: production
  labels:
    app.kubernetes.io/name: web-api
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: web-api
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
```

---

## 3. Ingress with TLS and Nginx Annotations

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-api-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-production"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "15"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
    - hosts:
        - api.domain.com
      secretName: api-domain-tls-certificate
  rules:
    - host: api.domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-api-service
                port:
                  number: 80
```

---

## 4. Horizontal Pod Autoscaler (HPA v2)

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
    name: web-api-deployment
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 75
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
          value: 20
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
```

---

## 5. ConfigMap & Secret Manifests

### ConfigMap (Application Parameters)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-api-config
  namespace: production
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "8080"
  ENABLE_METRICS: "true"
  DATABASE_HOST: "postgres-primary.production.svc.cluster.local"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "production_db"
```

### Secret (Encrypted / Sensitive Keys)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: web-api-secrets
  namespace: production
type: Opaque
stringData:
  DATABASE_USER: "api_user"
  DATABASE_PASSWORD: "SuperSecureRandomPassword123!"
  JWT_SECRET_KEY: "c2VjcmV0LWtleS1leGFtcGxlLWtleS1mb3Itand0"
```

---

## 6. PersistentVolumeClaim (PVC) Manifest

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-storage-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: standard-rwo # or gp3 on AWS, pd-balanced on GCP
  resources:
    requests:
      storage: 50Gi
```
