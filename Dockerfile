# syntax=docker/dockerfile:1

# A multi-stage build: the app is built with Node, and only the finished files are served by nginx.
#
#   docker build -t branch-locator .
#   docker run --rm -p 8080:8080 branch-locator          # then open http://localhost:8080
#   docker build --target test .                         # optional: lint, formatting and unit tests
#
# Keep NODE_VERSION in step with .nvmrc.
ARG NODE_VERSION=24

# 1. Dependencies: only package.json and the lockfile, so this layer is reused until they change.
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build: type-checks, then writes the production files to /app/dist.
FROM deps AS build
COPY . .
RUN npm run build

# Optional: `docker build --target test .` fails if lint, formatting or a unit test does.
# The end-to-end tests need a browser and run in CI instead (see .github/workflows/ci.yml).
FROM build AS test
RUN npm run lint && npm run format:check && npm test

# 3. Serve: nginx that runs as a normal user (not root) and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# /healthz is answered by nginx itself, so it says the server is up without touching the files.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
