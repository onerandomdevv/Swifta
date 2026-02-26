# HARDWARE OS

**The Operating System for Lagos Hardware Trade**

HARDWARE OS is a production-grade B2B trade platform that digitizes the hardware materials supply chain in Lagos, Nigeria. It handles the complete transaction lifecycle — from product listing to merchant payout — while preserving the trust, negotiation dynamics, and relationships that define Lagos hardware trade.

> This is not a marketplace clone. It's trade infrastructure.

---

## What It Does

1. **Merchant** registers and lists products (cement, rods, plumbing, etc.) — no public prices
2. **Buyer** browses the catalogue and sends a Request for Quote (RFQ)
3. **Merchant** responds with a private quote (unit price, delivery fee, validity period)
4. **Buyer** accepts the quote → order is created, stock is reserved
5. **Buyer** pays securely via Paystack → money is held
6. **Merchant** dispatches and generates a 6-digit delivery OTP
7. **Buyer** enters OTP to confirm receipt → merchant gets paid out automatically

---

## Architecture

```
hardware-os/
├── apps/
│   ├── backend/          → NestJS modular monolith (API server)
│   └── web/              → Next.js 14 App Router (frontend)
├── packages/
│   └── shared/           → Shared types, enums, constants, utilities
├── docker-compose.yml    → Local Postgres + Redis
├── pnpm-workspace.yaml   → Monorepo workspace config
└── turbo.json            → Build orchestration
```

| Layer       | Technology                       | Purpose                                           |
| ----------- | -------------------------------- | ------------------------------------------------- |
| Frontend    | Next.js 14, TypeScript, Tailwind | Web app for merchants and buyers                  |
| Backend     | NestJS, Prisma, TypeScript       | API server with 8 domain modules                  |
| Database    | PostgreSQL 16                    | Primary data store (Supabase-managed in prod)     |
| Cache/Queue | Redis 7 + BullMQ                 | Sessions, background jobs, notification queue     |
| Payments    | Paystack                         | Card/bank payments, webhook verification, payouts |
| Monorepo    | pnpm + Turborepo                 | Workspace management, parallel builds             |

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 8 (`npm install -g pnpm`)
- Docker + Docker Compose

### Setup

```bash
# 1. Clone
git clone <repo-url>
cd hardware-os

# 2. Install
pnpm install

# 3. Start databases
docker-compose up -d

# 4. Configure environment
cp .env.example apps/backend/.env
# Edit apps/backend/.env with your Paystack test keys

# 5. Database setup
cd apps/backend
npx prisma migrate dev
npx prisma db seed
cd ../..

# 6. Run (two terminals)
pnpm --filter @hardware-os/backend dev    # http://localhost:4000
pnpm --filter @hardware-os/web dev        # http://localhost:3000

# 7. Verify
curl http://localhost:4000/health
```

---

## Project Documentation

| Document              | Location                                               | Audience                       |
| --------------------- | ------------------------------------------------------ | ------------------------------ |
| Backend README        | [apps/backend/README.md](apps/backend/README.md)       | Backend & fullstack developers |
| Frontend README       | [apps/web/README.md](apps/web/README.md)               | Frontend developers            |
| Shared Package README | [packages/shared/README.md](packages/shared/README.md) | All developers                 |

---

## Environment Variables

### Backend (`apps/backend/.env`)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hardware_os
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx
PAYSTACK_BASE_URL=https://api.paystack.co
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@hardwareos.ng
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PAYSTACK_KEY=pk_test_xxxxx
```

> ⚠️ Never commit `.env` files. Only `.env.example` is tracked.

---

## V1 Scope

### Included

- ✅ Merchant onboarding + product listing (no public prices)
- ✅ RFQ → Quote → Order lifecycle
- ✅ Paystack payments with webhook verification
- ✅ OTP delivery confirmation + automated merchant payout
- ✅ Event-based inventory tracking
- ✅ JWT auth with refresh token rotation
- ✅ In-app + email notifications

### Not Included (Future Phases)

- ❌ SMS / USSD
- ❌ Product images
- ❌ BNPL / trade credit
- ❌ AI forecasting
- ❌ Logistics tracking
- ❌ Admin panel

---

## Commands

| Command                                   | What It Does              |
| ----------------------------------------- | ------------------------- |
| `pnpm install`                            | Install all dependencies  |
| `pnpm build`                              | Build all packages        |
| `pnpm --filter @hardware-os/backend dev`  | Start backend dev server  |
| `pnpm --filter @hardware-os/web dev`      | Start frontend dev server |
| `pnpm --filter @hardware-os/backend test` | Run backend tests         |
| `docker-compose up -d`                    | Start Postgres + Redis    |
| `docker-compose down`                     | Stop databases            |

---

## Team

| Developer | Role          | Owns                                                   |
| --------- | ------------- | ------------------------------------------------------ |
| Dev A     | Backend Lead  | Auth, Order, Payment, Infrastructure                   |
| Dev B     | Fullstack     | Merchant, Product, RFQ, Quote, Inventory, Notification |
| Dev C     | Frontend Lead | All pages, components, API integration                 |

---

## License

Proprietary. All rights reserved.
