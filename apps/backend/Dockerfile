# ── Stage 1: Prune monorepo to backend only ──
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g turbo

COPY . .

RUN turbo prune --scope=@twizrr/backend --docker

# ── Stage 2: Install deps + build ──
FROM node:20-alpine AS installer

WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

# Generate Prisma Client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build backend + shared
RUN pnpm turbo run build --filter=@twizrr/backend...

# ── Stage 3: Slim production runner ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run
COPY --from=installer /app/apps/backend/dist ./apps/backend/dist
COPY --from=installer /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=installer /app/apps/backend/src/prisma ./apps/backend/src/prisma
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=installer /app/package.json ./package.json

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "apps/backend/dist/main"]
