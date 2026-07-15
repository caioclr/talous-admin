# Multi-stage build for the Next.js admin panel (standalone output).
# Builds natively for the host arch (arm64 on the Oracle Ampere VM).
# The admin proxies the backend server-side via a Next rewrite whose destination
# is BACKEND_API_ORIGIN. Next resolves rewrites at BUILD time, so this must be a
# build arg (not only a runtime env) — otherwise the default localhost:8001 gets
# baked and the proxy fails (ECONNREFUSED) inside the compose network.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG BACKEND_API_ORIGIN=http://api:8001
ENV BACKEND_API_ORIGIN=$BACKEND_API_ORIGIN
# Client bundle base URL. Must be the RELATIVE same-origin path so the browser
# calls https://admin.../api/v1/... and Next rewrites it server-side to
# BACKEND_API_ORIGIN. NEXT_PUBLIC_* is inlined at build time — if left unset the
# client falls back to http://localhost:8001 and every browser request fails.
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=6001
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 6001
CMD ["node", "server.js"]
