# syntax=docker/dockerfile:1
# Production image for a local or self-hosted run (B-24). Build and run with docker-compose.prod.yml;
# see docs/docker.md. Nothing here publishes the app anywhere.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone
COPY . .
RUN npm run build

# One-off tasks (migrations, staff accounts, retention) need the sources and tsx.
FROM deps AS tools
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
USER node
CMD ["npx", "tsx", "scripts/migrate.ts"]

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/app/storage/uploads
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
RUN mkdir -p /app/storage/uploads && chown -R node:node /app/storage
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/saude').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "server.js"]
