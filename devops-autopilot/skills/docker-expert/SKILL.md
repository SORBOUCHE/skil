---
name: docker-expert
description: Expert in containerization, multi-stage Dockerfiles, Docker Compose architectures, image size optimization, and security hardening.
---

# Docker Expert Skill

This skill empowers Antigravity to design, build, optimize, and secure container images and multi-container environments using Docker, Docker BuildKit, and Docker Compose.

---

## 1. When to Activate

Activate this skill whenever the user asks to:
- Containerize an application (Node.js, Python, Go, Java, Rust, Flutter Web, Ruby, PHP, etc.).
- Create, audit, or optimize an existing `Dockerfile` or `docker-compose.yml`.
- Troubleshoot container build errors, caching issues, or container networking failures.
- Implement security hardening for containers (CIS Docker Benchmark, non-root users, distroless images, capability dropping).
- Set up local development or staging environments with databases, caching layers, reverse proxies, and volume persistence.
- Reduce Docker image size and build times using multi-stage builds and BuildKit cache mounts.

---

## 2. Multi-Stage Dockerfile Patterns

Multi-stage builds separate the build environment (compilers, build tools, package managers, development dependencies) from the final minimal runtime image.

### A. Node.js (TypeScript / NestJS / Next.js)
```dockerfile
# Stage 1: Dependencies resolver
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Application builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

# Stage 3: Minimal production runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Create dedicated non-root user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

### B. Python (FastAPI / Flask with Poetry or Pip)
```dockerfile
# Stage 1: Build dependencies & virtualenv
FROM python:3.11-slim-bookworm AS builder
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_NO_INTERACTION=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --without dev

# Stage 2: Runtime image
FROM python:3.11-slim-bookworm AS runner
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/false appuser

COPY --from=builder --chown=appuser:appgroup /app/.venv /app/.venv
COPY --chown=appuser:appgroup . /app

USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### C. Go (Static Compilation to Scratch or Distroless)
```dockerfile
# Stage 1: Build binary
FROM golang:1.22-alpine AS builder
WORKDIR /src
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

RUN apk add --no-cache git ca-certificates tzdata
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -ldflags="-w -s" -o /bin/server ./cmd/server

# Stage 2: Static Distroless
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /bin/server /bin/server

USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/bin/server"]
```

### D. Java (Spring Boot with Eclipse Temurin and JRE extraction)
```dockerfile
# Stage 1: Build Jar
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: JRE Runtime
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar

USER appuser
EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### E. Flutter Web (Build + Nginx Alpine)
```dockerfile
# Stage 1: Flutter SDK build
FROM ghcr.io/cirruslabs/flutter:stable AS builder
WORKDIR /app
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get
COPY . .
RUN flutter build web --release

# Stage 2: Nginx unprivileged Alpine
FROM nginxinc/nginx-unprivileged:alpine-slim AS runner
COPY --from=builder /app/build/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Security Hardening Principles

1. **Non-Root Execution**:
   - Always declare a non-privileged user (`USER appuser`).
   - Assign non-zero UID and GID (e.g., `10001:10001`).
   - If writing files is required, pre-create the directories and chown them to `appuser` before switching `USER`.

2. **Read-Only Root Filesystem**:
   - Run containers with `--read-only` flag or `read_only: true` in Compose.
   - Explicitly mount `tmpfs` volumes for directories that need write access (e.g., `/tmp`, `/var/run`, `/app/cache`).

3. **No-New-Privileges & Capability Dropping**:
   - Add security options: `security_opt: ["no-new-privileges:true"]`.
   - Drop all default Linux capabilities: `cap_drop: [ALL]`.
   - Add only required capabilities (e.g., `cap_add: [NET_BIND_SERVICE]`).

4. **Minimal Base Images**:
   - Prefer `distroless`, `scratch`, or `-alpine` / `-slim` tags over standard images.
   - Eliminate package managers (`apt`, `apk`), compilers, and shell binaries from final stages.

5. **Scan for Vulnerabilities**:
   - Leverage tools like Trivy or Grype in CI: `trivy image --severity HIGH,CRITICAL myapp:tag`.

---

## 4. Docker Compose Best Practices

A production-grade `docker-compose.yml` follows these conventions:
1. **Health-aware dependencies**: Always pair `depends_on` with `condition: service_healthy` so services start only when dependencies are fully ready.
2. **Dedicated custom bridge networks**: Isolate service tiers (e.g., public frontend network, private backend/data network).
3. **Named persistent volumes**: Avoid anonymous volumes; name and manage volume mounts explicitly.
4. **Environment isolation**: Utilize `.env` files for non-sensitive defaults, and secrets or injected environment configurations for sensitive keys.
5. **Resource constraints**: Declare CPU and Memory reservations and limits to mimic orchestrator guarantees.

---

## 5. Health Check Patterns

### HTTP Endpoint Check (using curl/wget/builtin)
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1
```

### TCP Port Check (using nc / netcat)
```dockerfile
HEALTHCHECK --interval=20s --timeout=3s --retries=3 \
  CMD nc -z -w2 127.0.0.1 5432 || exit 1
```

### Script or Database Ping Check
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

---

## 6. Image Optimization & BuildKit Caching

- **Leverage BuildKit Cache Mounts**:
  Speed up package managers by mounting cache directories across builds:
  ```dockerfile
  # Node.js
  RUN --mount=type=cache,target=/root/.npm npm ci
  # Go
  RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build go build ...
  # Python
  RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
  ```

- **Strict `.dockerignore` Implementation**:
  Every project must include a `.dockerignore`:
  ```
  .git
  .github
  .vscode
  .idea
  node_modules
  dist
  build
  __pycache__
  *.pyc
  .env*
  !.env.example
  Dockerfile*
  docker-compose*.yml
  README.md
  tests/
  coverage/
  ```

- **Order Layers by Stability**:
  Place static dependencies (e.g., `package.json`, `go.mod`, `requirements.txt`) above source code copying (`COPY . .`).

---

## 7. Production-Ready Multi-Service Architecture Example

Here is a complete, hardened production setup: Node.js API + PostgreSQL + Redis + Nginx Reverse Proxy.

### `docker-compose.yml`
```yaml
version: "3.8"

networks:
  frontend_net:
    driver: bridge
  backend_net:
    driver: bridge
    internal: true

volumes:
  pg_data:
    driver: local
  redis_data:
    driver: local

services:
  reverse_proxy:
    image: nginx:1.25-alpine
    container_name: reverse_proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /var/cache/nginx:uid=101,gid=101
      - /var/run:uid=101,gid=101
    depends_on:
      api_service:
        condition: service_healthy
    networks:
      - frontend_net

  api_service:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: api_service
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://app_user:${DB_PASSWORD}@postgres_db:5432/app_production?sslmode=disable
      REDIS_URL: redis://redis_cache:6379/0
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    deploy:
      resources:
        limits:
          cpus: "1.00"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 128M
    depends_on:
      postgres_db:
        condition: service_healthy
      redis_cache:
        condition: service_healthy
    networks:
      - frontend_net
      - backend_net

  postgres_db:
    image: postgres:16-alpine
    container_name: postgres_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: app_production
    volumes:
      - pg_data:/var/lib/postgresql/data
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user -d app_production"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - backend_net

  redis_cache:
    image: redis:7.2-alpine
    container_name: redis_cache
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    volumes:
      - redis_data:/data
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - backend_net
```

---

## 8. Common Docker Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Correct Solution |
| :--- | :--- | :--- |
| **Running as Root** | Container breakout grants root access to host kernel | Always create and use a dedicated non-root UID/GID |
| **Using `:latest` Tag** | Non-deterministic builds, breaking changes without notice | Pin exact semantic tags or Git SHA digests |
| **Installing Dev Dependencies in Prod** | Bloats image size and exposes build-time vulnerabilities | Use multi-stage builds and prune dev packages |
| **Omitting `.dockerignore`** | Inadvertently bakes `.git`, secrets, and local builds into image | Include strict `.dockerignore` in every repository |
| **Single Layer Huge Monoliths** | Slow rebuilds and excessive bandwidth consumption | Separate dependencies from code; order layers logically |
| **Ignoring Signal Handling** | Containers hang on `docker stop` and get killed via `SIGKILL` | Ensure main process runs as PID 1 or use `tini` / `dumb-init` |
| **Hardcoding DB passwords in Dockerfile** | Credentials are baked permanently into layer history | Pass runtime secrets via environment variables or secret mounts |
