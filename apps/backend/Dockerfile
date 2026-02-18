FROM node:20-alpine AS builder

WORKDIR /app

# Install turbo
RUN npm install -g turbo

COPY . .

# Prune the workspace to just the backend
RUN turbo prune --scope=@hardware-os/backend --docker

# Install dependencies and build
FROM node:20-alpine AS installer
WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies 
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

# Generate Prisma Client
RUN npx prisma generate --schema=apps/backend/src/prisma/schema.prisma

# Build
RUN pnpm turbo run build --filter=@hardware-os/backend...

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=installer /app .

CMD ["node", "apps/backend/dist/main"]
