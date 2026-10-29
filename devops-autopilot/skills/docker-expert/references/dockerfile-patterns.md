# Dockerfile Production Templates & Patterns Reference

Ready-to-use, hardened multi-stage Dockerfile templates for common application stacks.

---

## 1. Node.js Production Multi-Stage (Alpine, Non-Root)

Suitable for NestJS, Next.js, Express, Fastify, and Remix applications.

```dockerfile
# -------------------------------------------------------------
# Stage 1: Dependency resolution and caching
# -------------------------------------------------------------
FROM node:20.12-alpine3.19 AS dependencies
WORKDIR /usr/src/app

# Install build tools if native addons (bcrypt, sharp) are needed
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# -------------------------------------------------------------
# Stage 2: Application compilation & asset build
# -------------------------------------------------------------
FROM node:20.12-alpine3.19 AS builder
WORKDIR /usr/src/app

COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .

# Run build step and strip development dependencies
RUN npm run build && npm prune --production

# -------------------------------------------------------------
# Stage 3: Minimal, hardened production runtime
# -------------------------------------------------------------
FROM node:20.12-alpine3.19 AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=3000

# Create dedicated non-root user
RUN addgroup -g 10001 -S nodejs && \
    adduser -S nodejs -u 10001 -G nodejs

# Copy runtime artifacts only
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/dist ./dist

# Security hardening
USER 10001:10001
EXPOSE 3000

# Health check validation
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["node", "dist/main.js"]
```

---

## 2. Python FastAPI / Flask (Slim, Non-Root, Virtualenv)

Production template using `python:3.11-slim-bookworm` with layer-cached dependencies and non-root execution.

```dockerfile
# -------------------------------------------------------------
# Stage 1: Build virtual environment and wheels
# -------------------------------------------------------------
FROM python:3.11-slim-bookworm AS builder
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# -------------------------------------------------------------
# Stage 2: Runtime image
# -------------------------------------------------------------
FROM python:3.11-slim-bookworm AS runner
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Add non-root system user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/false appuser

# Copy virtualenv and code
COPY --from=builder /opt/venv /opt/venv
COPY --chown=appuser:appgroup . /app

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]
```

---

## 3. Go Static Binary (Scratch / Distroless)

Creates an ultra-compact (~15MB), zero-vulnerability image with static compilation and CA certificates.

```dockerfile
# -------------------------------------------------------------
# Stage 1: Static binary compilation
# -------------------------------------------------------------
FROM golang:1.22-alpine3.19 AS builder
WORKDIR /src

ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN go build \
    -trimpath \
    -ldflags="-w -s -extldflags '-static'" \
    -o /bin/app \
    ./cmd/api

# -------------------------------------------------------------
# Stage 2: Google Distroless Static
# -------------------------------------------------------------
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /

# Copy timezone and root certificates
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /bin/app /bin/app

USER nonroot:nonroot
EXPOSE 8080

ENTRYPOINT ["/bin/app"]
```

---

## 4. Flutter Web (Multi-Stage with Unprivileged Nginx)

Builds Flutter Web client in release mode and serves it using Nginx unprivileged Alpine image.

```dockerfile
# -------------------------------------------------------------
# Stage 1: Flutter Web Compilation
# -------------------------------------------------------------
FROM ghcr.io/cirruslabs/flutter:stable AS builder
WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

COPY . .
RUN flutter build web --release --pwa-strategy=none

# -------------------------------------------------------------
# Stage 2: Nginx Web Server
# -------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:alpine-slim AS runner

# Custom Nginx configuration for Single Page Applications (SPA)
RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen       8080;
    server_name  localhost;

    root   /usr/share/nginx/html;
    index  index.html index.htm;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Health check
    location /health {
        access_log off;
        return 200 'healthy';
        add_header Content-Type text/plain;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

COPY --from=builder /app/build/web /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```
