# HARDWARE OS

**The Operating System for Lagos Hardware Trade**

HARDWARE OS is a production-grade B2B trade platform that digitizes the hardware materials supply chain in Lagos, Nigeria. It handles the complete transaction lifecycle — from product listing to merchant payout — while preserving the trust, negotiation dynamics, and relationships that define Lagos hardware trade.

> This is not a marketplace clone. It's trade infrastructure.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Running the App](#running-the-app)
- [Core Concepts](#core-concepts)
- [V1 Features](#v1-features)
- [API Endpoints](#api-endpoints)
- [State Machines](#state-machines)
- [Payment Flow](#payment-flow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

Lagos is one of Africa's largest hardware trading hubs. Thousands of merchants supply construction materials (cement, rods, plumbing, electrical, roofing) to contractors and developers. Despite moving billions of naira annually, the industry runs on phone calls, WhatsApp, paper invoices, and informal trust.

**HARDWARE OS solves this by providing:**

- **Product Catalogue** — Merchants list products (without public prices — pricing is private by design)
- **RFQ System** — Buyers request quotes, merchants respond with private pricing
- **Secure Payments** — Paystack integration with payment hold until delivery is confirmed
- **OTP Delivery Confirmation** — 6-digit code proves goods were received
- **Event-Based Inventory** — Every stock change is tracked as an immutable event
- **Automated Payouts** — Merchants receive bank transfers automatically after delivery confirmation

---

## Tech Stack

| Layer                | Technology                  | Purpose                                                    |
| -------------------- | --------------------------- | ---------------------------------------------------------- |
| **Frontend**         | Next.js 14 (App Router)     | Web application with TypeScript + Tailwind CSS             |
| **Backend**          | NestJS                      | Modular monolith API server                                |
| **Database**         | PostgreSQL 16               | Primary data store (Supabase-managed in production)        |
| **ORM**              | Prisma                      | Type-safe database queries and migrations                  |
| **Cache/Queue**      | Redis 7 + BullMQ            | Session storage, background jobs, notification queue       |
| **Payments**         | Paystack                    | Payment processing, webhook verification, merchant payouts |
| **Monorepo**         | pnpm Workspaces + Turborepo | Package management and build orchestration                 |
| **Containerization** | Docker + Docker Compose     | Local development environment                              |

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│    Vercel  |  App Router  |  Tailwind   │
└───────────────────┬─────────────────────┘
                    │ REST API (HTTPS)
                    ▼
┌─────────────────────────────────────────┐
│          Backend (NestJS)               │
│   8 Domain Modules | Prisma | BullMQ   │
└───────┬───────────────────┬─────────────┘
        │                   │
        ▼                   ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │
│  (Supabase)  │   │  (Sessions   │
│  13 models   │   │  + Queues)   │
└──────────────┘   └──────────────┘
```

### Domain Modules

| Module           | Responsibility                                                             |
| ---------------- | -------------------------------------------------------------------------- |
| **Auth**         | Registration, login, JWT access/refresh tokens, Redis session management   |
| **Merchant**     | Business profiles, progressive onboarding, verification status             |
| **Product**      | CRUD with soft delete, buyer-facing catalogue                              |
| **RFQ**          | Request for Quote creation, expiry (72hr cron), status management          |
| **Quote**        | Price submission, acceptance/decline, atomic order creation on accept      |
| **Order**        | Strict state machine, OTP delivery confirmation, event logging             |
| **Payment**      | Paystack integration, webhook verification, idempotent processing, payouts |
| **Inventory**    | Append-only event tracking, stock cache, reservation/release               |
| **Notification** | In-app + email alerts via BullMQ async queue                               |

---

## Project Structure

```
hardware-os/
├── apps/
│   ├── backend/                  # NestJS API server
│   │   └── src/
│   │       ├── config/           # Environment configuration
│   │       ├── common/           # Guards, decorators, filters, middleware
│   │       ├── prisma/           # Schema, migrations, seed
│   │       ├── redis/            # Redis client module
│   │       ├── queue/            # BullMQ setup
│   │       ├── health/           # Health check endpoint
│   │       └── modules/          # 8 domain modules
│   │           ├── auth/
│   │           ├── merchant/
│   │           ├── product/
│   │           ├── rfq/
│   │           ├── quote/
│   │           ├── order/
│   │           ├── payment/
│   │           ├── inventory/
│   │           └── notification/
│   │
│   └── web/                      # Next.js frontend
│       └── src/
│           ├── app/              # Pages (App Router)
│           │   ├── (auth)/       # Login, register (no sidebar)
│           │   └── (dashboard)/  # Merchant + buyer dashboards
│           ├── components/       # UI + feature components
│           ├── hooks/            # Custom React hooks
│           ├── providers/        # Auth, toast contexts
│           ├── lib/              # API client + utilities
│           └── styles/           # Global CSS
│
├── packages/
│   └── shared/                   # Shared types, enums, constants, utils
│       └── src/
│           ├── enums/            # OrderStatus, RFQStatus, etc.
│           ├── types/            # TypeScript interfaces for all entities
│           ├── constants/        # Order transitions, defaults
│           └── utils/            # Money formatting (kobo ↔ Naira)
│
├── docker-compose.yml            # Local Postgres + Redis
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 8 (`npm install -g pnpm`)
- **Docker** and **Docker Compose** (for local Postgres + Redis)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd hardware-os
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Local Databases

```bash
docker-compose up -d
```

This starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 4. Configure Environment

```bash
cp .env.example apps/backend/.env
```

Edit `apps/backend/.env` with your values (see [Environment Variables](#environment-variables) below).

### 5. Run Database Migrations

```bash
cd apps/backend
npx prisma migrate dev
npx prisma db seed
cd ../..
```

### 6. Start Development Servers

```bash
# Terminal 1: Backend (http://localhost:4000)
pnpm --filter @hardware-os/backend dev

# Terminal 2: Frontend (http://localhost:3000)
pnpm --filter @hardware-os/web dev
```

### 7. Verify

```bash
curl http://localhost:4000/health
# Returns: { "status": "ok", "db": true, "redis": true }
```

---

## Environment Variables

Create `apps/backend/.env` with the following:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hardware_os

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=<generate-a-64-char-random-string>
JWT_REFRESH_SECRET=<generate-a-different-64-char-random-string>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Paystack (get test keys from https://dashboard.paystack.com)
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx
PAYSTACK_BASE_URL=https://api.paystack.co

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@hardwareos.ng

# App
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

Create `apps/web/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PAYSTACK_KEY=pk_test_xxxxx
```

> ⚠️ Never commit `.env` files. Only `.env.example` is tracked in git.

---

## Database

### Schema

The database has 13 models:

| Model             | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| User              | Accounts (buyer or merchant)                      |
| MerchantProfile   | Business info, bank details, verification         |
| Product           | Listings (no price field — prices come via Quote) |
| RFQ               | Request for Quote from buyer to merchant          |
| Quote             | Merchant's price response to an RFQ               |
| Order             | Transaction record with strict state machine      |
| OrderEvent        | Append-only audit log of order status changes     |
| Payment           | Paystack payment records (inflow + payout)        |
| PaymentEvent      | Raw Paystack webhook payloads                     |
| InventoryEvent    | Append-only stock change ledger                   |
| ProductStockCache | Computed current stock (derived from events)      |
| Notification      | In-app + email notification records               |

### Key Rules

- All IDs are **UUID v4**
- All money is **BigInt in kobo** (₦1 = 100 kobo)
- Three tables are **append-only**: OrderEvent, PaymentEvent, InventoryEvent
- Inventory is **never mutated directly** — stock is derived from events
- All table names use **snake_case** via `@@map()`

### Useful Commands

```bash
npx prisma studio          # Visual database browser
npx prisma migrate dev     # Create and apply migrations
npx prisma generate        # Regenerate client after schema changes
npx prisma migrate reset   # Reset database (drops all data)
npx prisma db seed         # Seed test data
```

---

## Running the App

| Command                                    | What It Does                  |
| ------------------------------------------ | ----------------------------- |
| `pnpm install`                             | Install all dependencies      |
| `pnpm build`                               | Build all packages            |
| `pnpm --filter @hardware-os/backend dev`   | Start backend in dev mode     |
| `pnpm --filter @hardware-os/web dev`       | Start frontend in dev mode    |
| `pnpm --filter @hardware-os/backend build` | Build backend for production  |
| `pnpm --filter @hardware-os/web build`     | Build frontend for production |
| `pnpm --filter @hardware-os/backend test`  | Run backend tests             |
| `docker-compose up -d`                     | Start local Postgres + Redis  |
| `docker-compose down`                      | Stop local databases          |

---

## Core Concepts

### No Public Prices

Products intentionally have **no price field**. Lagos hardware merchants negotiate prices privately. The RFQ → Quote flow mirrors their existing behavior:

1. Buyer sees a product and sends an RFQ
2. Merchant responds with a private Quote (price + delivery fee + validity)
3. Buyer accepts or declines

### Event-Based Inventory

Stock is **never updated directly**. Every change is an event:

```
STOCK_IN       → +50 bags (merchant adds stock)
ORDER_RESERVED → -30 bags (buyer accepts quote)
ORDER_RELEASED → +30 bags (order cancelled)
ADJUSTMENT     → +5 bags  (manual correction)

Current stock = SUM of all event quantities for that product
```

A `ProductStockCache` table is kept in sync within the same database transaction for fast reads.

### Money in Kobo

All monetary values are stored as **BigInt in kobo** (1 Naira = 100 kobo):

```
₦6,500.00  → stored as 650000
₦325,000   → stored as 32500000
₦0.50      → stored as 50
```

Use the shared utility: `formatKobo(650000n)` → `"₦6,500.00"`

### Tenant Isolation

Every merchant-scoped database query includes a `merchantId` filter. This is enforced by `MerchantContextMiddleware`, which extracts the merchant ID from the JWT token. One merchant can never see another's inventory, pricing, or sales data.

---

## V1 Features

### Included

- ✅ Merchant registration and progressive onboarding
- ✅ Product catalogue (text search, no images)
- ✅ RFQ creation with 72-hour auto-expiry
- ✅ Quote submission with expiry dates
- ✅ Atomic order creation on quote acceptance
- ✅ Paystack payment with webhook verification
- ✅ OTP delivery confirmation
- ✅ Automated merchant payout via Paystack Transfer
- ✅ Event-based inventory with stock cache
- ✅ In-app + email notifications (10 trigger types)
- ✅ JWT auth with refresh token rotation and Redis revocation

### Not Included (Future Phases)

- ❌ WhatsApp / SMS / USSD integration
- ❌ Product images
- ❌ BNPL / trade credit
- ❌ AI demand forecasting
- ❌ Logistics tracking
- ❌ Admin panel
- ❌ Real-time WebSockets
- ❌ Advanced analytics

---

## API Endpoints

### Auth

| Method | Endpoint         | Auth | Description    |
| ------ | ---------------- | ---- | -------------- |
| POST   | `/auth/register` | No   | Create account |
| POST   | `/auth/login`    | No   | Get JWT tokens |
| POST   | `/auth/refresh`  | No   | Refresh tokens |
| POST   | `/auth/logout`   | Yes  | Revoke session |

### Merchant

| Method | Endpoint         | Auth     | Description    |
| ------ | ---------------- | -------- | -------------- |
| GET    | `/merchants/me`  | Merchant | Own profile    |
| PATCH  | `/merchants/me`  | Merchant | Update profile |
| GET    | `/merchants/:id` | Public   | Public profile |

### Product

| Method | Endpoint                | Auth     | Description    |
| ------ | ----------------------- | -------- | -------------- |
| POST   | `/products`             | Merchant | Create product |
| GET    | `/products`             | Merchant | Own products   |
| GET    | `/products/catalogue`   | Public   | Browse all     |
| GET    | `/products/:id`         | Public   | Product detail |
| PATCH  | `/products/:id`         | Merchant | Update         |
| DELETE | `/products/:id`         | Merchant | Soft delete    |
| POST   | `/products/:id/restore` | Merchant | Restore        |

### RFQ

| Method | Endpoint           | Auth     | Description   |
| ------ | ------------------ | -------- | ------------- |
| POST   | `/rfqs`            | Buyer    | Create RFQ    |
| GET    | `/rfqs`            | Buyer    | Own RFQs      |
| GET    | `/rfqs/merchant`   | Merchant | Incoming RFQs |
| GET    | `/rfqs/:id`        | Any      | RFQ detail    |
| POST   | `/rfqs/:id/cancel` | Buyer    | Cancel RFQ    |

### Quote

| Method | Endpoint              | Auth     | Description   |
| ------ | --------------------- | -------- | ------------- |
| POST   | `/quotes`             | Merchant | Submit quote  |
| POST   | `/quotes/:id/accept`  | Buyer    | Accept quote  |
| POST   | `/quotes/:id/decline` | Buyer    | Decline quote |
| GET    | `/quotes/rfq/:rfqId`  | Any      | Quote for RFQ |

### Order

| Method | Endpoint                       | Auth     | Description      |
| ------ | ------------------------------ | -------- | ---------------- |
| GET    | `/orders`                      | Any      | List orders      |
| GET    | `/orders/:id`                  | Any      | Order detail     |
| POST   | `/orders/:id/dispatch`         | Merchant | Dispatch order   |
| POST   | `/orders/:id/confirm-delivery` | Buyer    | Confirm with OTP |
| POST   | `/orders/:id/cancel`           | Any      | Cancel order     |
| POST   | `/orders/:id/dispute`          | Buyer    | Report dispute   |

### Payment

| Method | Endpoint               | Auth   | Description      |
| ------ | ---------------------- | ------ | ---------------- |
| POST   | `/payments/initialize` | Buyer  | Start payment    |
| POST   | `/payments/webhook`    | None\* | Paystack webhook |

\*Protected by HMAC-SHA512 signature verification, not JWT.

### Inventory

| Method | Endpoint                | Auth     | Description       |
| ------ | ----------------------- | -------- | ----------------- |
| GET    | `/inventory/:productId` | Merchant | Stock level       |
| POST   | `/inventory/adjust`     | Merchant | Manual adjustment |

### Notification

| Method | Endpoint                      | Auth | Description        |
| ------ | ----------------------------- | ---- | ------------------ |
| GET    | `/notifications`              | Any  | List notifications |
| PATCH  | `/notifications/:id/read`     | Any  | Mark as read       |
| GET    | `/notifications/unread-count` | Any  | Unread count       |

---

## State Machines

### Order Status

```
PENDING_PAYMENT → PAID → DISPATCHED → DELIVERED → COMPLETED
       ↓           ↓         ↓
   CANCELLED   CANCELLED   DISPUTE
```

| From            | To         | Triggered By                   |
| --------------- | ---------- | ------------------------------ |
| PENDING_PAYMENT | PAID       | System (Paystack webhook)      |
| PENDING_PAYMENT | CANCELLED  | Buyer                          |
| PAID            | DISPATCHED | Merchant                       |
| PAID            | CANCELLED  | Merchant (triggers refund)     |
| DISPATCHED      | DELIVERED  | Buyer (OTP verified)           |
| DISPATCHED      | DISPUTE    | Buyer                          |
| DELIVERED       | COMPLETED  | System (auto, triggers payout) |

All transitions are enforced by `order-state-machine.ts`. Every transition creates an `OrderEvent` record.

### RFQ Status

```
OPEN → QUOTED → ACCEPTED
  ↓       ↓
EXPIRED  DECLINED
  ↓
CANCELLED
```

---

## Payment Flow

1. **Initialize**: Backend calls Paystack API, creates Payment record (INITIALIZED)
2. **Customer Pays**: Frontend opens Paystack inline popup
3. **Webhook**: Paystack POSTs to `/payments/webhook` (HMAC-SHA512 verified)
4. **Verify**: Backend double-checks via Paystack verify API
5. **Update**: Payment → SUCCESS, Order → PAID
6. **Payout**: On delivery confirmation, backend calls Paystack Transfer API

### Idempotency

- Payment initialization is keyed on `orderId` — same order returns same reference
- Webhook processing checks if payment is already SUCCESS — duplicates ignored
- Payout is keyed on `orderId + PAYOUT direction` — one payout per order

---

## Testing

```bash
# Run backend unit tests
pnpm --filter @hardware-os/backend test

# Run backend e2e tests
pnpm --filter @hardware-os/backend test:e2e

# Paystack webhook testing (install Paystack CLI)
paystack listen --forward-to localhost:4000/payments/webhook

# Paystack test card
# Number: 4084 0840 8408 4081
# Expiry: Any future date
# CVV: Any 3 digits
# OTP: 123456
```

---

## Deployment

### Backend

The backend includes a multi-stage `Dockerfile`:

```bash
docker build -t hardware-os-backend apps/backend/
```

Deploy to Railway, Render, or Fly.io. Connect to:

- Supabase PostgreSQL (production database)
- Managed Redis instance
- Set Paystack webhook URL to your production domain

### Frontend

Deploy to Vercel:

```bash
cd apps/web
vercel
```

Set environment variables:

- `NEXT_PUBLIC_API_URL` → your production backend URL
- `NEXT_PUBLIC_PAYSTACK_KEY` → your Paystack live public key

---

## Contributing

### Branch Naming

```
feature/<module>-<description>    e.g. feature/auth-refresh-token
fix/<module>-<description>        e.g. fix/payment-webhook-duplicate
```

### Module Ownership

| Developer             | Modules                                                |
| --------------------- | ------------------------------------------------------ |
| Dev A (Backend Lead)  | Auth, Order, Payment, Infrastructure                   |
| Dev B (Fullstack)     | Merchant, Product, RFQ, Quote, Inventory, Notification |
| Dev C (Frontend Lead) | All frontend pages, components, API integration        |

### Rules

1. Never mutate inventory directly — always append an InventoryEvent
2. Never skip the order state machine — all transitions go through `validateTransition()`
3. Never query merchant data without `merchantId` filter
4. Never store money as float — BigInt kobo only
5. Never put business logic in controllers — delegate to services
6. Never process webhooks without signature verification
7. Never add features outside V1 scope

---

## License

Proprietary. All rights reserved.
