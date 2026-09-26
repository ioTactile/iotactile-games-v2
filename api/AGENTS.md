# syntax=docker/dockerfile:1

# ---- Base ----

# Node 24 Alpine for small image size; native TS execution (no build step needed)

FROM node:24-alpine AS base

RUN corepack enable
WORKDIR /app

# ---- Dependencies ----

# Install production dependencies in an isolated stage for layer caching

FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
pnpm install --frozen-lockfile --prod --ignore-scripts

# ---- Dev ----

FROM base AS dev

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
pnpm install --frozen-lockfile --ignore-scripts

COPY . .

CMD ["pnpm", "run", "dev"]

# ---- Production ----

FROM base AS production

# dumb-init for proper PID 1 signal forwarding

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

# Bind to all interfaces so the container is reachable from the Docker network

ENV SERVER_HOST=0.0.0.0

# Create a non-root user

RUN addgroup -g 1001 -S nodejs && \
adduser -S api -u 1001 -G nodejs

# Copy production node_modules from deps stage

COPY --from=deps /app/node_modules ./node_modules

# Copy package.json (needed for ESM "type":"module" and "#src/\*" path aliases)

COPY package.json ./

# Copy application source

COPY src ./src

USER api

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
CMD ["node", "-e", "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw r;process.exit(0)}).catch(()=>process.exit(1))"]

CMD ["dumb-init", "node", "--import", "./src/instrumentation.ts", "./src/index.ts"]
