# HARDWARE OS — Backend & Fullstack Developer Guide

**Audience:** Dev A (Backend Lead) and Dev B (Fullstack)
**Version:** V1 Scope-Frozen
**Last Updated:** February 2026

---

## TABLE OF CONTENTS

1. [What Are We Building?](#1-what-are-we-building)
2. [Why It Works This Way](#2-why-it-works-this-way)
3. [Tech Stack Explained](#3-tech-stack-explained)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [How Data Flows End-to-End](#5-how-data-flows-end-to-end)
6. [The 5 Core User Flows](#6-the-5-core-user-flows)
7. [Project Structure Explained](#7-project-structure-explained)
8. [Shared Package Deep Dive](#8-shared-package-deep-dive)
9. [Backend Module-by-Module Guide](#9-backend-module-by-module-guide)
10. [Database Schema Explained](#10-database-schema-explained)
11. [State Machines](#11-state-machines)
12. [Payment System (Paystack)](#12-payment-system-paystack)
13. [Event Tables & Inventory System](#13-event-tables--inventory-system)
14. [Authentication & Authorization](#14-authentication--authorization)
15. [Notification System](#15-notification-system)
16. [Error Handling Patterns](#16-error-handling-patterns)
17. [API Endpoint Reference](#17-api-endpoint-reference)
18. [Dev A vs Dev B Task Split](#18-dev-a-vs-dev-b-task-split)
19. [Common Pitfalls & Rules](#19-common-pitfalls--rules)
20. [Local Development Setup](#20-local-development-setup)

---

## 1. What Are We Building?

HARDWARE OS is a B2B trade platform for Lagos hardware merchants (cement, rods, plumbing, electrical, roofing). Think of it as trade infrastructure — not a marketplace clone.

**The problem:** Lagos hardware trade runs on phone calls, WhatsApp, paper invoices, and informal trust. No digital records, no payment tracking, no inventory visibility.

**What V1 solves:**
- Merchant registers, lists products (no public prices — this is intentional)
- Buyer browses products, sends a Request for Quote (RFQ) to a merchant
- Merchant responds with a Quote (price, delivery fee, validity period)
- Buyer accepts the quote → Order is created
- Buyer pays via Paystack → Merchant gets notified
- Merchant dispatches → Buyer confirms delivery with OTP
- Merchant gets paid out

**What V1 does NOT do:**
- No WhatsApp integration
- No SMS/USSD
- No BNPL / trade credit
- No AI forecasting
- No logistics tracking
- No admin panel
- No product images
- No real-time WebSockets

---

## 2. Why It Works This Way

### Why no public prices?
Hardware merchants in Lagos intentionally hide prices. Negotiation is part of their business model. Showing prices publicly would face massive resistance. That's why we use the RFQ → Quote flow — the buyer asks, the merchant names their price privately.

### Why event tables instead of direct updates?
We never directly update inventory or order status. Instead, we append events (like a ledger). This gives us:
- Full audit trail (who changed what, when)
- Ability to rebuild current state from events
- No "lost" data from overwrites
- Foundation for future analytics

### Why BigInt for money?
All money is stored in **kobo** (1 Naira = 100 kobo) as BigInt. This avoids floating-point rounding errors. ₦1,500.50 is stored as `150050`. Never use floats for money.

### Why custom JWT instead of Supabase Auth?
We use Supabase only for PostgreSQL hosting. Auth is custom JWT because:
- We need full control over token lifecycle
- We need Redis-based session revocation
- Supabase Auth adds complexity we don't need
- Mixing two auth systems creates bugs

### Why modular monolith instead of microservices?
Microservices are overkill for a 3-person team. A modular monolith gives us:
- Clean module boundaries (same as microservices)
- Single deployment (much simpler ops)
- Direct function calls instead of HTTP between services
- Can extract to microservices later if needed

---

## 3. Tech Stack Explained

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js 14 (App Router) + TypeScript + Tailwind │
│  Hosted on: Vercel                               │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS (REST API)
                       ▼
┌─────────────────────────────────────────────────┐
│                   BACKEND                        │
│  NestJS (Express) + TypeScript                   │
│  Hosted on: Railway / Render / Fly.io            │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Prisma   │  │  BullMQ  │  │  Paystack     │  │
│  │  ORM      │  │  Queues  │  │  HTTP Client  │  │
│  └────┬─────┘  └────┬─────┘  └───────────────┘  │
│       │              │                            │
└───────┼──────────────┼────────────────────────────┘
        │              │
        ▼              ▼
┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │
│  (Supabase)  │ │  (Managed)   │
│              │ │              │
│  12 tables   │ │  Sessions +  │
│  + 1 cache   │ │  Job Queues  │
└──────────────┘ └──────────────┘
```

| Technology | What It Does | Why We Chose It |
|------------|-------------|-----------------|
| **NestJS** | Backend framework | Modular architecture built-in, TypeScript-first, dependency injection |
| **Prisma** | Database ORM | Type-safe queries, auto-generated client, easy migrations |
| **PostgreSQL** | Primary database | Reliable, supports BigInt, JSON columns, strong indexing |
| **Supabase** | Hosts our PostgreSQL | Managed Postgres, free tier for dev, easy connection |
| **Redis** | Cache + queues + sessions | Fast key-value store for JWT refresh tokens and BullMQ job queue |
| **BullMQ** | Background job queue | Sends emails async, runs RFQ expiry cron, doesn't block API responses |
| **Paystack** | Payment processing | Nigerian payment gateway, handles cards/bank transfers/USSD payments |
| **Next.js** | Frontend framework | React with SSR, App Router for file-based routing, Vercel deployment |
| **Tailwind** | CSS framework | Utility-first, fast to build UI, consistent design |
| **pnpm** | Package manager | Workspace support for monorepo, faster than npm |
| **Turborepo** | Build orchestrator | Parallelizes builds across packages, caches results |

---

## 4. System Architecture Overview

### High-Level Module Map

```
┌─────────────────────────────────────────────────────────┐
│                     APP MODULE                           │
│                                                          │
│  ┌──────────────────── INFRASTRUCTURE ─────────────────┐ │
│  │  PrismaModule    RedisModule    QueueModule         │ │
│  │  ConfigModule    HealthModule                        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────── DOMAIN MODULES ─────────────────┐ │
│  │                                                      │ │
│  │  AuthModule ──→ issues JWT tokens                    │ │
│  │       │                                              │ │
│  │       ▼                                              │ │
│  │  MerchantModule ──→ profiles, onboarding             │ │
│  │       │                                              │ │
│  │       ▼                                              │ │
│  │  ProductModule ──→ CRUD, catalogue                   │ │
│  │       │                                              │ │
│  │       ▼                                              │ │
│  │  RFQModule ──→ buyer requests quotes                 │ │
│  │       │                                              │ │
│  │       ▼                                              │ │
│  │  QuoteModule ──→ merchant responds with price        │ │
│  │       │                                              │ │
│  │       ▼ (accept triggers)                            │ │
│  │  OrderModule ──→ state machine, OTP                  │ │
│  │       │                                              │ │
│  │       ├──→ PaymentModule ──→ Paystack integration    │ │
│  │       │                                              │ │
│  │       └──→ InventoryModule ──→ stock events          │ │
│  │                                                      │ │
│  │  NotificationModule ──→ triggered by all modules     │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Module Dependency Map

This shows which modules import which. If a module isn't listed as a dependency, it should NOT be imported.

```
AuthModule
  ├── imports: PrismaModule, RedisModule, PassportModule, JwtModule
  ├── exports: nothing (guards are used directly)
  └── depends on: nothing else

MerchantModule
  ├── imports: PrismaModule
  ├── exports: MerchantService
  └── depends on: nothing else

ProductModule
  ├── imports: PrismaModule
  ├── exports: ProductService
  └── depends on: nothing else

RFQModule
  ├── imports: PrismaModule, ProductModule, NotificationModule, QueueModule
  ├── exports: RFQService
  └── depends on: ProductService (to validate product exists)

QuoteModule
  ├── imports: PrismaModule, RFQModule, OrderModule, InventoryModule, NotificationModule
  ├── exports: nothing
  └── depends on: RFQService, OrderService, InventoryService

OrderModule
  ├── imports: PrismaModule, NotificationModule, InventoryModule
  ├── exports: OrderService
  └── depends on: InventoryService, NotificationTriggerService

PaymentModule
  ├── imports: PrismaModule, OrderModule, NotificationModule
  ├── exports: nothing
  └── depends on: OrderService, NotificationTriggerService

InventoryModule
  ├── imports: PrismaModule
  ├── exports: InventoryService
  └── depends on: nothing else

NotificationModule
  ├── imports: PrismaModule, QueueModule
  ├── exports: NotificationTriggerService
  └── depends on: nothing else
```

**Rule: No circular dependencies.** If Module A imports Module B, then Module B must NOT import Module A. The dependency flows one direction: Auth → Merchant/Product → RFQ → Quote → Order → Payment. Notification is a leaf that everything can call.

---

## 5. How Data Flows End-to-End

Here's the complete lifecycle of a single transaction, from registration to payout:

```
STEP 1: REGISTRATION
════════════════════
Merchant → POST /auth/register { email, phone, password, businessName, role: "MERCHANT" }
  → Backend hashes password (bcrypt)
  → Creates User record (role: MERCHANT)
  → Creates MerchantProfile record (verification: UNVERIFIED)
  → Issues JWT access token (15 min) + refresh token (7 days)
  → Stores refresh token hash in Redis
  → Returns { accessToken, refreshToken }

Buyer → POST /auth/register { email, phone, password, role: "BUYER" }
  → Same flow, but no MerchantProfile created


STEP 2: MERCHANT LISTS PRODUCTS
════════════════════════════════
Merchant → POST /products { name: "Dangote Cement", unit: "bag", categoryTag: "cement", minOrderQuantity: 10 }
  → Auth guard verifies JWT
  → MerchantContext middleware extracts merchantId from JWT
  → Creates Product record (NO PRICE — price comes later via Quote)
  → Returns Product

  NOTE: Products have NO price field. This is by design.
  Price is only revealed when merchant submits a Quote.


STEP 3: BUYER CREATES RFQ
══════════════════════════
Buyer → POST /rfqs { productId: "xxx", quantity: 50, deliveryAddress: "Lekki Phase 1", notes: "Need delivery by Friday" }
  → Validates product exists and is active
  → Looks up product's merchantId
  → Creates RFQ record (status: OPEN, expiresAt: now + 72 hours)
  → Triggers notification → merchant gets "New RFQ" email + in-app notification
  → Returns RFQ


STEP 4: MERCHANT SUBMITS QUOTE
═══════════════════════════════
Merchant → POST /quotes { rfqId: "xxx", unitPriceKobo: 650000, totalPriceKobo: 32500000, deliveryFeeKobo: 500000, validUntil: "2026-03-01", notes: "Price valid for 48hrs" }
  → Validates RFQ exists and status is OPEN
  → Validates RFQ belongs to this merchant
  → Creates Quote record (status: PENDING)
  → Updates RFQ status → QUOTED
  → Triggers notification → buyer gets "Quote Received" email + in-app
  → Returns Quote

  MONEY EXAMPLE:
  unitPriceKobo: 650000 = ₦6,500.00 per bag
  totalPriceKobo: 32500000 = ₦325,000.00 (50 bags × ₦6,500)
  deliveryFeeKobo: 500000 = ₦5,000.00


STEP 5: BUYER ACCEPTS QUOTE
════════════════════════════
Buyer → POST /quotes/:id/accept
  → Validates quote exists, status is PENDING, not expired
  → Validates buyer owns the RFQ
  → IN A SINGLE DATABASE TRANSACTION:
      1. Updates Quote status → ACCEPTED
      2. Updates RFQ status → ACCEPTED
      3. Creates Order record (status: PENDING_PAYMENT, idempotencyKey: generated UUID)
      4. Creates InventoryEvent (type: ORDER_RESERVED, quantity: -50)
      5. Updates ProductStockCache (stock -= 50)
  → Triggers notification → merchant gets "Quote Accepted"
  → Returns Order

  WHY TRANSACTION? If any step fails, everything rolls back.
  We never end up with a Quote accepted but no Order created.


STEP 6: BUYER PAYS
═══════════════════
Buyer → POST /payments/initialize { orderId: "xxx" }
  → Validates order exists, status is PENDING_PAYMENT, buyer owns it
  → Checks idempotency: does Payment already exist for this orderId?
      YES → returns existing Paystack reference (no double charge)
      NO  → calls Paystack API to initialize transaction
  → Creates Payment record (status: INITIALIZED, direction: INFLOW)
  → Returns { authorizationUrl, reference } to frontend
  → Frontend opens Paystack popup with this URL

Paystack → POST /payments/webhook (after buyer completes payment)
  → Webhook signature guard verifies HMAC-SHA512 hash
  → Extracts reference from payload
  → Calls Paystack verify API to double-check
  → Checks: is Payment already SUCCESS? → ignore (idempotent)
  → Updates Payment status → SUCCESS
  → Creates PaymentEvent (stores full Paystack payload)
  → Transitions Order status → PAID
  → Creates OrderEvent (from: PENDING_PAYMENT, to: PAID)
  → Triggers notifications → buyer + merchant get "Payment Confirmed"


STEP 7: MERCHANT DISPATCHES
════════════════════════════
Merchant → POST /orders/:id/dispatch
  → Validates order exists, status is PAID, merchant owns it
  → Generates 6-digit OTP, stores in Order.deliveryOtp
  → Transitions Order status → DISPATCHED
  → Creates OrderEvent
  → Triggers notification → buyer gets "Order Dispatched" (OTP is NOT in notification)
  → Returns Order (merchant sees OTP to give to delivery person)

  OTP FLOW: Merchant gives OTP to delivery person → delivery person
  tells buyer the OTP → buyer enters OTP in the app to confirm receipt.


STEP 8: BUYER CONFIRMS DELIVERY
════════════════════════════════
Buyer → POST /orders/:id/confirm-delivery { otp: "482917" }
  → Validates order exists, status is DISPATCHED, buyer owns it
  → Validates OTP matches Order.deliveryOtp
  → Transitions Order status → DELIVERED
  → Creates OrderEvent
  → Immediately transitions → COMPLETED
  → Creates OrderEvent
  → Initiates payout to merchant (Paystack Transfer API)
  → Creates Payment record (direction: PAYOUT)
  → Triggers notification → merchant gets "Delivery Confirmed" + "Payout Initiated"


STEP 9: MERCHANT RECEIVES MONEY
════════════════════════════════
Paystack → POST /payments/webhook (transfer success event)
  → Verifies webhook signature
  → Updates Payment (PAYOUT) status → SUCCESS
  → Creates PaymentEvent
  → DONE. Money is in merchant's bank account.
```

---

## 6. The 5 Core User Flows

### Flow Diagram: The Happy Path

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  BUYER   │         │  SYSTEM  │         │ MERCHANT │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                     │                    │
     │   Register          │     Register       │
     ├────────────────────►│◄───────────────────┤
     │                     │                    │
     │                     │   List Products    │
     │                     │◄───────────────────┤
     │                     │                    │
     │   Browse Catalogue  │                    │
     │◄────────────────────┤                    │
     │                     │                    │
     │   Create RFQ        │                    │
     ├────────────────────►│                    │
     │                     │   Notify: New RFQ  │
     │                     ├───────────────────►│
     │                     │                    │
     │                     │   Submit Quote     │
     │                     │◄───────────────────┤
     │   Notify: Quote     │                    │
     │◄────────────────────┤                    │
     │                     │                    │
     │   Accept Quote      │                    │
     ├────────────────────►│                    │
     │                     │──┐                 │
     │                     │  │ Create Order    │
     │                     │  │ Reserve Stock   │
     │                     │◄─┘                 │
     │                     │   Notify: Accepted │
     │                     ├───────────────────►│
     │                     │                    │
     │   Pay (Paystack)    │                    │
     ├────────────────────►│                    │
     │                     │──┐                 │
     │                     │  │ Verify Payment  │
     │                     │  │ Order → PAID    │
     │                     │◄─┘                 │
     │                     │   Notify: Paid     │
     │                     ├───────────────────►│
     │                     │                    │
     │                     │   Dispatch + OTP   │
     │                     │◄───────────────────┤
     │   Notify: Shipped   │                    │
     │◄────────────────────┤                    │
     │                     │                    │
     │   Enter OTP         │                    │
     ├────────────────────►│                    │
     │                     │──┐                 │
     │                     │  │ Verify OTP      │
     │                     │  │ Order→COMPLETED │
     │                     │  │ Trigger Payout  │
     │                     │◄─┘                 │
     │                     │  Notify: Payout    │
     │                     ├───────────────────►│
     │                     │                    │
     ▼                     ▼                    ▼
                      DONE ✓
```

---

## 7. Project Structure Explained

### Root Level

```
hardware-os/                    ← Monorepo root
├── apps/
│   ├── backend/                ← NestJS API server (Dev A + Dev B)
│   └── web/                    ← Next.js frontend (Dev C, with Dev B integration)
├── packages/
│   └── shared/                 ← Types, enums, constants shared by both apps
├── docker-compose.yml          ← Starts Postgres + Redis locally
├── pnpm-workspace.yaml         ← Tells pnpm these are linked packages
├── turbo.json                  ← Parallelizes build/dev/lint commands
└── tsconfig.base.json          ← Shared TypeScript settings
```

### Backend Structure — What Each Folder Does

```
apps/backend/src/
│
├── main.ts                     ← Entry point. Starts the NestJS app.
│                                  Sets up CORS, helmet, validation pipe, port.
│
├── app.module.ts               ← Root module. Imports ALL other modules.
│                                  This is the "wiring diagram" of the app.
│
├── config/                     ← Environment variable loading
│   ├── app.config.ts           ← PORT, NODE_ENV, FRONTEND_URL
│   ├── database.config.ts      ← DATABASE_URL
│   ├── redis.config.ts         ← REDIS_URL
│   ├── paystack.config.ts      ← PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, etc.
│   └── jwt.config.ts           ← JWT secrets and TTLs
│
│   WHY: Config is centralized so env vars are validated at startup,
│   not scattered across random files with process.env calls.
│
├── common/                     ← Cross-cutting concerns (used by ALL modules)
│   ├── decorators/
│   │   ├── current-user.decorator.ts      ← @CurrentUser() — extracts user from JWT
│   │   ├── current-merchant.decorator.ts  ← @CurrentMerchant() — extracts merchantId
│   │   ├── roles.decorator.ts             ← @Roles(UserRole.MERCHANT) — marks required role
│   │   └── idempotency-key.decorator.ts   ← @IdempotencyKey() — extracts X-Idempotency-Key header
│   │
│   ├── guards/
│   │   ├── jwt-auth.guard.ts              ← Blocks request if no valid access token
│   │   ├── jwt-refresh.guard.ts           ← Validates refresh token specifically
│   │   ├── roles.guard.ts                 ← Blocks request if user role doesn't match @Roles()
│   │   └── merchant-verified.guard.ts     ← Blocks if merchant verification !== VERIFIED
│   │
│   │   HOW GUARDS STACK:
│   │   @UseGuards(JwtAuthGuard, RolesGuard)
│   │   @Roles(UserRole.MERCHANT)
│   │   async createProduct() { ... }
│   │
│   │   1. JwtAuthGuard runs first → verifies token → attaches user to request
│   │   2. RolesGuard runs second → checks user.role against @Roles() metadata
│   │   3. If both pass → controller method executes
│   │
│   ├── middleware/
│   │   └── merchant-context.middleware.ts  ← Runs BEFORE guards on merchant routes
│   │                                         Extracts merchantId from JWT payload
│   │                                         Attaches to req.merchantId
│   │                                         EVERY merchant-scoped query uses this ID
│   │
│   ├── filters/
│   │   └── global-exception.filter.ts     ← Catches ALL unhandled errors
│   │                                         Returns consistent { error, code, statusCode }
│   │                                         Never leaks stack traces to client
│   │
│   ├── pipes/
│   │   └── validation.pipe.ts             ← Auto-validates all DTOs via class-validator
│   │                                         whitelist: true (strips unknown fields)
│   │                                         transform: true (auto-converts types)
│   │
│   └── interceptors/
│       └── response-transform.interceptor.ts  ← Wraps all responses in:
│                                                  { success: true, data: <actual response> }
│
├── prisma/
│   ├── schema.prisma           ← THE source of truth for all database tables
│   ├── prisma.module.ts        ← Makes PrismaService available app-wide
│   ├── prisma.service.ts       ← Extends PrismaClient, handles connection lifecycle
│   ├── seed.ts                 ← Creates test data for local development
│   └── migrations/             ← Auto-generated migration SQL files
│
├── redis/
│   ├── redis.module.ts         ← Makes Redis client available app-wide
│   └── redis.service.ts        ← Typed wrapper: get(), set(), del(), exists()
│
├── queue/
│   ├── queue.module.ts         ← Registers BullMQ with Redis connection
│   └── queue.constants.ts      ← Queue name constants: NOTIFICATION_QUEUE, RFQ_EXPIRY_QUEUE
│
├── health/
│   └── health.controller.ts    ← GET /health → checks DB + Redis connectivity
│
└── modules/                    ← THE 8 DOMAIN MODULES (all business logic lives here)
    ├── auth/                   ← Registration, login, JWT, sessions
    ├── merchant/               ← Merchant profiles, onboarding
    ├── product/                ← Product CRUD, catalogue
    ├── rfq/                    ← Request for Quote lifecycle
    ├── quote/                  ← Quote submission, acceptance
    ├── order/                  ← Order state machine, OTP
    ├── payment/                ← Paystack integration, webhooks, payout
    ├── inventory/              ← Event-based stock tracking
    └── notification/           ← In-app + email notifications
```

### Inside a Domain Module (Example: Order)

Every domain module follows the same pattern:

```
modules/order/
├── order.module.ts             ← NestJS module definition
│                                  Declares what this module imports, provides, exports
│
├── order.controller.ts         ← HTTP endpoints (routes)
│                                  Handles request/response only
│                                  Delegates ALL logic to the service
│                                  Never contains business logic
│
├── order.service.ts            ← Business logic
│                                  All database queries
│                                  All validation rules
│                                  Calls other services (inventory, notification)
│
├── order-state-machine.ts      ← Pure function: validates state transitions
│                                  No database, no side effects
│                                  Just: "can I go from status A to status B?"
│
├── dto/
│   └── confirm-delivery.dto.ts ← Input validation class
│                                  Uses class-validator decorators
│                                  Auto-validated by ValidationPipe
│
└── order.service.spec.ts       ← Unit tests
```

**The rule:** Controller → Service → Database. Never skip a layer.

```
WRONG:  Controller queries database directly
WRONG:  Controller contains if/else business logic
RIGHT:  Controller calls service method, service handles everything
```

---

## 8. Shared Package Deep Dive

`packages/shared/` is imported by BOTH backend and frontend as `@hardware-os/shared`.

```
packages/shared/src/
│
├── enums/                      ← All status enums
│   ├── order-status.enum.ts    ← PENDING_PAYMENT | PAID | DISPATCHED | DELIVERED | COMPLETED | CANCELLED | DISPUTE
│   ├── rfq-status.enum.ts     ← OPEN | QUOTED | ACCEPTED | DECLINED | EXPIRED | CANCELLED
│   ├── quote-status.enum.ts   ← PENDING | ACCEPTED | DECLINED | EXPIRED | WITHDRAWN
│   ├── payment-status.enum.ts ← INITIALIZED | SUCCESS | FAILED | REFUNDED
│   └── ... (8 more enum files)
│
│   WHY SHARED: Both backend and frontend need to reference the same
│   status values. If backend says PENDING_PAYMENT and frontend checks
│   for "pending_payment" (lowercase), things break silently.
│
├── types/                      ← TypeScript interfaces for all entities
│   ├── order.types.ts          ← Order interface, OrderEvent interface
│   ├── payment.types.ts        ← Payment interface, InitializePaymentDto
│   └── ... (9 more type files)
│
│   WHY SHARED: Frontend needs to know the shape of API responses.
│   Backend needs to know the shape of request bodies.
│   Single source of truth prevents drift.
│
├── constants/
│   ├── order-transitions.ts    ← The state machine transition map
│   │                              { PENDING_PAYMENT: [PAID, CANCELLED], ... }
│   └── defaults.ts             ← RFQ_EXPIRY_HOURS = 72, OTP_LENGTH = 6, etc.
│
└── utils/
    └── money.ts                ← koboToNaira(650000n) → "₦6,500.00"
                                   nairaToKobo(6500) → 650000n
                                   ALWAYS use these. Never do manual division.
```

**IMPORTANT: Shared types vs Backend DTOs**

These are NOT the same thing:

```
packages/shared/src/types/auth.types.ts:
  → interface RegisterDto { email: string; phone: string; ... }
  → Plain TypeScript interface. No decorators. Used by frontend.

apps/backend/src/modules/auth/dto/register.dto.ts:
  → class RegisterDto { @IsEmail() email: string; @IsString() phone: string; ... }
  → Class with class-validator decorators. Used by backend validation pipe.
```

The shared types define the SHAPE. The backend DTOs enforce VALIDATION. Both exist, both are needed.

---

## 9. Backend Module-by-Module Guide

### Auth Module (Dev A owns this)

**Files:**
- `auth.controller.ts` — 4 endpoints
- `auth.service.ts` — handles hashing, token generation, Redis storage
- `strategies/jwt-access.strategy.ts` — Passport strategy for access tokens
- `strategies/jwt-refresh.strategy.ts` — Passport strategy for refresh tokens

**Endpoints:**
```
POST /auth/register     ← Creates user + merchant profile (if merchant)
POST /auth/login        ← Validates credentials, returns tokens
POST /auth/refresh      ← Takes refresh token, returns new token pair
POST /auth/logout       ← Revokes refresh token in Redis (protected)
```

**Token Lifecycle:**
```
1. User logs in → backend generates:
   - Access token (JWT, 15 min TTL, contains: sub, email, role, merchantId)
   - Refresh token (JWT, 7 day TTL, contains: sub)
   
2. Access token is sent with every API request in Authorization header
   
3. When access token expires (15 min):
   - Frontend calls POST /auth/refresh with refresh token
   - Backend verifies refresh token exists in Redis
   - Backend generates NEW access token + NEW refresh token
   - Old refresh token is deleted from Redis (rotation)
   
4. On logout:
   - Backend deletes refresh token from Redis
   - Access token naturally expires in ≤15 min
   - For immediate revocation, access token check can also verify Redis
   
5. If refresh token is stolen:
   - Rotation means the real user's next refresh invalidates the stolen token
   - Attacker's stolen token becomes useless
```

**Redis Key Pattern:**
```
refresh_token:{userId} → hashed_refresh_token
TTL: 7 days (matches JWT refresh TTL)
```

---

### Merchant Module (Dev B owns this)

**Files:**
- `merchant.controller.ts` — 3 endpoints
- `merchant.service.ts` — profile CRUD

**Endpoints:**
```
GET   /merchants/me      ← Get own full profile (protected, merchant only)
PATCH /merchants/me      ← Update profile fields (protected, merchant only)
GET   /merchants/:id     ← Get public profile: businessName + verification status only (public)
```

**Onboarding Steps:**
```
Step 1: Account created (registration) → onboardingStep = 1
Step 2: Business info filled (address, CAC) → onboardingStep = 2
Step 3: Bank details added → onboardingStep = 3, verification → PENDING
Step 4: (Future) Admin verifies → verification → VERIFIED
```

For V1, merchants can list products at ANY onboarding step. Bank details are only required to receive payouts.

---

### Product Module (Dev B owns this)

**Endpoints:**
```
POST   /products              ← Create product (merchant only)
GET    /products              ← List own products (merchant only)
GET    /products/catalogue    ← Browse all active products (public, paginated, searchable)
GET    /products/:id          ← Get single product (public)
PATCH  /products/:id          ← Update product (merchant only, own products)
DELETE /products/:id          ← Soft delete (merchant only, sets deletedAt)
POST   /products/:id/restore  ← Restore soft-deleted product (merchant only)
```

**Key Rules:**
- Products have NO price field. Price exists only on Quote.
- `categoryTag` is free text ("cement", "rods", "plumbing"). Not a categories table.
- Catalogue search is basic: `WHERE name ILIKE '%search%' OR categoryTag ILIKE '%search%'`
- Soft delete: sets `deletedAt` timestamp. Catalogue query filters `WHERE deletedAt IS NULL`.
- Every query on merchant-owned products MUST include `WHERE merchantId = <from context>`.

---

### RFQ Module (Dev B owns this)

**Endpoints:**
```
POST   /rfqs              ← Create RFQ (buyer only)
GET    /rfqs              ← List own RFQs (buyer only)
GET    /rfqs/merchant     ← List incoming RFQs (merchant only)
GET    /rfqs/:id          ← Get RFQ detail
POST   /rfqs/:id/cancel   ← Cancel own RFQ (buyer only, if status is OPEN)
```

**RFQ Lifecycle:**
```
OPEN → QUOTED     (when merchant submits a quote)
OPEN → EXPIRED    (when 72 hours pass with no quote — cron job)
OPEN → CANCELLED  (when buyer cancels)
QUOTED → ACCEPTED (when buyer accepts the quote)
QUOTED → DECLINED (when buyer declines the quote)
```

**Expiry Cron Job:**
- `rfq-expiry.processor.ts` runs every hour via BullMQ repeatable job
- Finds all RFQs where `status = OPEN AND expiresAt < now()`
- Updates them to `EXPIRED`
- Triggers "RFQ Expired" notification to buyer

---

### Quote Module (Dev B owns this)

**Endpoints:**
```
POST   /quotes                ← Submit quote for an RFQ (merchant only)
POST   /quotes/:id/accept     ← Accept a quote (buyer only)
POST   /quotes/:id/decline    ← Decline a quote (buyer only)
GET    /quotes/rfq/:rfqId     ← Get quote for a specific RFQ
```

**Critical: Quote Acceptance is a Transaction**

When buyer accepts a quote, ALL of this must happen atomically:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update quote status → ACCEPTED
  // 2. Update RFQ status → ACCEPTED
  // 3. Create Order (PENDING_PAYMENT)
  // 4. Create InventoryEvent (ORDER_RESERVED)
  // 5. Update ProductStockCache
});
```

If any step fails, everything rolls back. No partial state.

**Race Condition Protection:**

Buyer might double-click "Accept". Use optimistic locking:

```sql
UPDATE quotes SET status = 'ACCEPTED' WHERE id = $1 AND status = 'PENDING'
```

Check `affectedRows`. If 0, the quote was already accepted/declined.

---

### Order Module (Dev A owns this)

**Endpoints:**
```
GET    /orders                      ← List orders (filtered by role: buyer or merchant)
GET    /orders/:id                  ← Get order detail with events timeline
POST   /orders/:id/dispatch         ← Mark as dispatched + generate OTP (merchant only)
POST   /orders/:id/confirm-delivery ← Verify OTP + complete order (buyer only)
POST   /orders/:id/cancel           ← Cancel order (buyer if PENDING_PAYMENT, merchant if PAID)
POST   /orders/:id/dispute          ← Report issue (buyer only, if DISPATCHED)
```

**See Section 11 for the full state machine.**

---

### Payment Module (Dev A owns this)

**See Section 12 for the complete Paystack integration guide.**

---

### Inventory Module (Dev B owns this)

**See Section 13 for the event-based inventory system.**

---

### Notification Module (Dev B owns this)

**See Section 15 for the notification system.**

---

## 10. Database Schema Explained

### Entity Relationship Diagram

```
┌──────────┐     1:1     ┌─────────────────┐
│   User   │────────────►│ MerchantProfile  │
│          │             │                  │
│ id (PK)  │             │ id (PK)          │
│ email    │             │ userId (FK,UQ)   │
│ phone    │             │ businessName     │
│ role     │             │ verification     │
│ password │             │ bankCode         │
└──────┬───┘             │ bankAccountNo    │
       │                 └────────┬─────────┘
       │                          │
       │                          │ 1:many
       │                          ▼
       │                 ┌─────────────────┐
       │                 │    Product       │
       │                 │                  │
       │                 │ id (PK)          │
       │                 │ merchantId (FK)  │
       │                 │ name             │
       │                 │ unit             │──────── 1:1 ───► ProductStockCache
       │                 │ categoryTag      │
       │                 │ NO PRICE FIELD   │
       │                 └────────┬─────────┘
       │                          │
       │ 1:many                   │ 1:many
       ▼                          ▼
┌──────────────┐         ┌──────────────┐
│     RFQ      │         │ InventoryEvent│ (append-only)
│              │         │              │
│ id (PK)     │         │ id (PK)      │
│ buyerId (FK)│         │ productId(FK)│
│ productId(FK)│        │ eventType    │
│ merchantId  │         │ quantity     │
│ quantity    │         │ referenceId  │
│ status      │         └──────────────┘
└──────┬───────┘
       │ 1:many (V1: always 1)
       ▼
┌──────────────┐
│    Quote     │
│              │
│ id (PK)     │
│ rfqId (FK)  │
│ merchantId  │
│ unitPriceKobo│
│ totalPriceKobo│
│ deliveryFeeKobo│
│ validUntil  │
│ status      │
└──────┬───────┘
       │ 1:1
       ▼
┌──────────────┐         ┌──────────────┐
│    Order     │────────►│  OrderEvent  │ (append-only)
│              │ 1:many  │              │
│ id (PK)     │         │ id (PK)      │
│ quoteId(FK,UQ)│       │ orderId (FK) │
│ buyerId (FK)│         │ fromStatus   │
│ merchantId  │         │ toStatus     │
│ status      │         │ triggeredBy  │
│ deliveryOtp │         │ metadata     │
│ idempotencyKey│       └──────────────┘
└──────┬───────┘
       │ 1:many
       ▼
┌──────────────┐         ┌──────────────┐
│   Payment    │────────►│ PaymentEvent │ (append-only)
│              │ 1:many  │              │
│ id (PK)     │         │ id (PK)      │
│ orderId (FK)│         │ paymentId(FK)│
│ paystackRef │         │ eventType    │
│ amountKobo  │         │ payload (JSON)│
│ status      │         └──────────────┘
│ direction   │
│ idempotencyKey│
└──────────────┘

┌──────────────┐
│ Notification │
│              │
│ id (PK)     │
│ userId (FK) │
│ type         │
│ title        │
│ body         │
│ channel      │
│ isRead       │
└──────────────┘
```

### Key Schema Rules

1. **All IDs are UUID v4** — never auto-increment integers
2. **All money fields are BigInt** — `unitPriceKobo`, `totalPriceKobo`, `deliveryFeeKobo`, `totalAmountKobo`, `amountKobo`
3. **All table names are snake_case** — via `@@map("table_name")`
4. **All column names are snake_case** — via `@map("column_name")`
5. **All foreign keys have indexes** — via `@@index([foreignKeyField])`
6. **Three tables are append-only** — OrderEvent, PaymentEvent, InventoryEvent. NO updates, NO deletes. Ever.
7. **`currency` field exists** on Quote, Order, Payment — always "NGN" in V1, but the field exists for future multi-currency

---

## 11. State Machines

### Order State Machine

This is the most critical piece of logic in the system. It lives in `order-state-machine.ts`.

```
                    ┌──────────────────┐
                    │ PENDING_PAYMENT  │
                    └────────┬─────────┘
                             │
                 ┌───────────┼───────────┐
                 │                       │
                 ▼                       ▼
            ┌─────────┐          ┌─────────────┐
            │  PAID   │          │  CANCELLED  │
            └────┬────┘          └─────────────┘
                 │
         ┌───────┼───────┐
         │               │
         ▼               ▼
    ┌────────────┐ ┌─────────────┐
    │ DISPATCHED │ │  CANCELLED  │
    └─────┬──────┘ └─────────────┘
          │
    ┌─────┼──────┐
    │            │
    ▼            ▼
┌───────────┐ ┌─────────┐
│ DELIVERED │ │ DISPUTE │
└─────┬─────┘ └─────────┘
      │
      ▼
┌───────────┐
│ COMPLETED │
└───────────┘
```

**Transition Whitelist (the ONLY allowed transitions):**

| From | To | Who Triggers | What Happens |
|------|----|-------------|-------------|
| PENDING_PAYMENT | PAID | System (webhook) | Payment verified via Paystack |
| PENDING_PAYMENT | CANCELLED | Buyer | Stock released, no refund needed |
| PAID | DISPATCHED | Merchant | 6-digit OTP generated |
| PAID | CANCELLED | Merchant | Auto-refund triggered |
| DISPATCHED | DELIVERED | Buyer (OTP) | OTP verified |
| DISPATCHED | DISPUTE | Buyer | Manual resolution (V1: offline) |
| DELIVERED | COMPLETED | System (auto) | Payout triggered |

**Any transition NOT in this table is REJECTED.** The code:

```typescript
// order-state-machine.ts
import { ORDER_TRANSITIONS } from '@hardware-os/shared';

export function validateTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
```

**Every transition MUST:**
1. Call `validateTransition()` — reject if false
2. Create an OrderEvent record — this is the audit log
3. Include `triggeredBy` (the user ID who initiated the transition)

### RFQ Status Transitions

```
OPEN ──→ QUOTED      (merchant submits quote)
OPEN ──→ EXPIRED     (72hr cron)
OPEN ──→ CANCELLED   (buyer cancels)
QUOTED ──→ ACCEPTED  (buyer accepts quote)
QUOTED ──→ DECLINED  (buyer declines quote)
```

### Quote Status Transitions

```
PENDING ──→ ACCEPTED   (buyer accepts)
PENDING ──→ DECLINED   (buyer declines)
PENDING ──→ EXPIRED    (validUntil passes)
PENDING ──→ WITHDRAWN  (merchant withdraws — V1: not exposed via API)
```

---

## 12. Payment System (Paystack)

### How Paystack Works

```
STEP 1: Initialize (our backend → Paystack API)
─────────────────────────────────────────────────
POST https://api.paystack.co/transaction/initialize
Body: { email, amount (kobo), reference, callback_url }
Response: { authorization_url, reference }

STEP 2: Customer pays (frontend → Paystack popup)
──────────────────────────────────────────────────
Frontend opens Paystack inline popup with the reference.
Customer enters card/bank details on Paystack's secure page.
Paystack processes payment.

STEP 3: Webhook (Paystack → our backend)
────────────────────────────────────────
POST /payments/webhook
Headers: x-paystack-signature (HMAC-SHA512 of body)
Body: { event: "charge.success", data: { reference, amount, ... } }

STEP 4: Verify (our backend → Paystack API)
────────────────────────────────────────────
GET https://api.paystack.co/transaction/verify/:reference
Response: { status: true, data: { status: "success", amount, ... } }

STEP 5: Payout (our backend → Paystack API)
────────────────────────────────────────────
POST https://api.paystack.co/transfer
Body: { source: "balance", amount (kobo), recipient, reason, reference }
```

### Idempotency Rules

| Scenario | How We Prevent Double Processing |
|----------|--------------------------------|
| Buyer clicks "Pay" twice | Payment initialized with orderId as key. Second call returns existing reference. |
| Paystack sends webhook twice | Check if Payment status is already SUCCESS. If yes, ignore. |
| Payout triggered twice | Payment created with orderId + PAYOUT direction as compound key. |
| Network timeout on initialize | Frontend retries with same orderId. Backend returns same reference. |

### Webhook Signature Verification

```typescript
// webhook-signature.guard.ts
const hash = crypto
  .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
  .update(JSON.stringify(requestBody))
  .digest('hex');

if (hash !== request.headers['x-paystack-signature']) {
  throw new UnauthorizedException('Invalid webhook signature');
}
```

**CRITICAL:** The webhook endpoint has NO JwtAuthGuard. It's public. Only the HMAC signature verification protects it.

### Payment Flow Diagram

```
┌────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Buyer  │      │ Backend  │      │ Paystack │      │ Merchant │
└───┬────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
    │                │                  │                  │
    │ POST /payments │                  │                  │
    │ /initialize    │                  │                  │
    ├───────────────►│                  │                  │
    │                │ Initialize txn   │                  │
    │                ├─────────────────►│                  │
    │                │ { auth_url, ref }│                  │
    │                │◄─────────────────┤                  │
    │ { auth_url }   │                  │                  │
    │◄───────────────┤                  │                  │
    │                │                  │                  │
    │ Open Paystack  │                  │                  │
    │ popup          │                  │                  │
    ├──────────────────────────────────►│                  │
    │                │                  │                  │
    │ Enter card     │                  │                  │
    │ details        │                  │                  │
    ├──────────────────────────────────►│                  │
    │                │                  │                  │
    │                │  Webhook:        │                  │
    │                │  charge.success  │                  │
    │                │◄─────────────────┤                  │
    │                │                  │                  │
    │                │ Verify signature │                  │
    │                │ Verify txn       │                  │
    │                ├─────────────────►│                  │
    │                │ { success }      │                  │
    │                │◄─────────────────┤                  │
    │                │                  │                  │
    │                │ Order → PAID     │                  │
    │                │ Notify buyer     │                  │
    │◄───────────────┤                  │                  │
    │                │ Notify merchant  │                  │
    │                ├─────────────────────────────────────►
    │                │                  │                  │
```

---

## 13. Event Tables & Inventory System

### Why Events, Not Direct Updates?

```
BAD (direct mutation):
  UPDATE products SET stock = stock - 50 WHERE id = 'xxx'
  
  Problems:
  - Who changed it? When? Why?
  - What if the update was wrong? Can't undo.
  - No audit trail.
  - Race conditions on concurrent updates.

GOOD (event sourcing lite):
  INSERT INTO inventory_events (product_id, event_type, quantity, reference_id)
  VALUES ('xxx', 'ORDER_RESERVED', -50, 'order-id')
  
  Current stock = SELECT SUM(quantity) FROM inventory_events WHERE product_id = 'xxx'
  
  Benefits:
  - Full history of every stock change
  - Every event has a type, timestamp, and reference
  - Can rebuild current stock at any time
  - Can't accidentally "lose" data
```

### Inventory Event Types

| Event Type | Quantity Sign | When It Happens | reference_id |
|-----------|--------------|-----------------|-------------|
| STOCK_IN | +positive | Merchant adds stock manually | null |
| STOCK_OUT | -negative | Manual stock removal | null |
| ADJUSTMENT | +/- either | Manual correction | null |
| ORDER_RESERVED | -negative | Buyer accepts quote → order created | order_id |
| ORDER_RELEASED | +positive | Order cancelled after reservation | order_id |

### Stock Cache Pattern

Computing stock from events on every request gets slow. So we maintain a cache:

```
InventoryEvent (source of truth, append-only)
  ↓ (updated in same transaction)
ProductStockCache (computed cache, always matches events)
```

```typescript
// Inside a Prisma transaction:
await tx.inventoryEvent.create({
  data: { productId, merchantId, eventType: 'ORDER_RESERVED', quantity: -50, referenceId: orderId }
});

await tx.productStockCache.upsert({
  where: { productId },
  update: { stock: { decrement: 50 } },
  create: { productId, stock: -50 }  // shouldn't happen, but safe
});
```

**Rule:** If the cache ever seems wrong, you can rebuild it:
```sql
UPDATE product_stock_cache psc
SET stock = (SELECT SUM(quantity) FROM inventory_events WHERE product_id = psc.product_id)
```

---

## 14. Authentication & Authorization

### Request Lifecycle

```
Frontend sends request
  │
  ▼
[Authorization: Bearer <access_token>]
  │
  ▼
JwtAuthGuard → validates token signature + expiry
  │ attaches user { sub, email, role, merchantId } to request
  ▼
MerchantContextMiddleware → if role=MERCHANT, sets req.merchantId
  │
  ▼
RolesGuard → checks user.role against @Roles() decorator
  │
  ▼
MerchantVerifiedGuard → (optional) checks verification status
  │
  ▼
Controller method executes
  │ uses @CurrentUser() and @CurrentMerchant() decorators
  ▼
Service method called with explicit userId / merchantId
  │ NEVER infers merchantId from anywhere else
  ▼
Database query includes WHERE merchantId = $1
```

### JWT Payload Structure

```json
{
  "sub": "uuid-of-user",
  "email": "merchant@example.com",
  "role": "MERCHANT",
  "merchantId": "uuid-of-merchant-profile",
  "iat": 1708300000,
  "exp": 1708300900
}
```

Buyers don't have `merchantId` in their token.

### Tenant Isolation (CRITICAL)

Every database query that touches merchant-specific data MUST include the merchant's ID:

```typescript
// WRONG — leaks data between merchants
async getProducts() {
  return this.prisma.product.findMany();
}

// RIGHT — scoped to merchant
async getProducts(merchantId: string) {
  return this.prisma.product.findMany({
    where: { merchantId, deletedAt: null }
  });
}
```

The `merchantId` parameter comes from `@CurrentMerchant()` decorator, which reads from the JWT. It is NEVER taken from request body or URL params.

---

## 15. Notification System

### Architecture

```
Any Module (Order, Quote, RFQ, Payment)
  │
  │ calls NotificationTriggerService.triggerXxx()
  │
  ▼
NotificationTriggerService
  │
  ├──→ Create Notification record in DB (IN_APP) ← synchronous, always works
  │
  └──→ Enqueue email job to BullMQ ← async, best-effort
         │
         ▼
    NotificationProcessor (BullMQ worker)
         │
         ▼
    EmailService.sendEmail() ← Resend API or SMTP
```

### Trigger Map

| Event | Method Called | Recipient |
|-------|-------------|-----------|
| New RFQ created | `triggerNewRFQ(merchantId, rfqId)` | Merchant |
| Quote submitted | `triggerQuoteReceived(buyerId, quoteId)` | Buyer |
| Quote accepted | `triggerQuoteAccepted(merchantId, quoteId)` | Merchant |
| Quote declined | `triggerQuoteDeclined(merchantId, quoteId)` | Merchant |
| RFQ expired | `triggerRFQExpired(buyerId, rfqId)` | Buyer |
| Payment confirmed | `triggerPaymentConfirmed(buyerId, merchantId, orderId)` | Both |
| Order cancelled | `triggerOrderCancelled(buyerId, merchantId, orderId)` | Both |
| Order dispatched | `triggerOrderDispatched(buyerId, orderId)` | Buyer |
| Delivery confirmed | `triggerDeliveryConfirmed(merchantId, orderId)` | Merchant |
| Payout initiated | `triggerPayoutInitiated(merchantId, orderId)` | Merchant |

**Rule:** If email fails, the in-app notification still exists. Email is best-effort. We never block a user flow because email sending failed.

---

## 16. Error Handling Patterns

### Consistent Error Response

Every error from the API looks like this:

```json
{
  "error": "Quote has expired",
  "code": "QUOTE_EXPIRED",
  "statusCode": 400
}
```

The `global-exception.filter.ts` catches everything and formats it.

### Common Error Codes

| Code | Status | When |
|------|--------|------|
| `VALIDATION_ERROR` | 400 | DTO validation fails |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `TOKEN_EXPIRED` | 401 | JWT expired |
| `FORBIDDEN` | 403 | Wrong role for this endpoint |
| `NOT_FOUND` | 404 | Entity doesn't exist |
| `QUOTE_EXPIRED` | 400 | Trying to accept expired quote |
| `INVALID_TRANSITION` | 400 | Order state machine rejects transition |
| `INVALID_OTP` | 400 | Wrong delivery OTP |
| `PAYMENT_ALREADY_PROCESSED` | 409 | Duplicate webhook |
| `INSUFFICIENT_STOCK` | 400 | Stock < requested quantity |
| `RFQ_NOT_OPEN` | 400 | Trying to quote a non-OPEN RFQ |
| `IDEMPOTENCY_CONFLICT` | 409 | Duplicate payment initialization |

---

## 17. API Endpoint Reference

### Auth
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/auth/register` | No | — | Create account |
| POST | `/auth/login` | No | — | Get tokens |
| POST | `/auth/refresh` | No | — | Refresh tokens |
| POST | `/auth/logout` | Yes | Any | Revoke session |

### Merchant
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/merchants/me` | Yes | MERCHANT | Own profile |
| PATCH | `/merchants/me` | Yes | MERCHANT | Update profile |
| GET | `/merchants/:id` | No | — | Public profile |

### Product
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/products` | Yes | MERCHANT | Create |
| GET | `/products` | Yes | MERCHANT | Own products |
| GET | `/products/catalogue` | No | — | Browse all |
| GET | `/products/:id` | No | — | Single product |
| PATCH | `/products/:id` | Yes | MERCHANT | Update |
| DELETE | `/products/:id` | Yes | MERCHANT | Soft delete |
| POST | `/products/:id/restore` | Yes | MERCHANT | Restore |

### RFQ
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/rfqs` | Yes | BUYER | Create RFQ |
| GET | `/rfqs` | Yes | BUYER | Own RFQs |
| GET | `/rfqs/merchant` | Yes | MERCHANT | Incoming RFQs |
| GET | `/rfqs/:id` | Yes | Any | Detail |
| POST | `/rfqs/:id/cancel` | Yes | BUYER | Cancel |

### Quote
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/quotes` | Yes | MERCHANT | Submit quote |
| POST | `/quotes/:id/accept` | Yes | BUYER | Accept |
| POST | `/quotes/:id/decline` | Yes | BUYER | Decline |
| GET | `/quotes/rfq/:rfqId` | Yes | Any | Get for RFQ |

### Order
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/orders` | Yes | Any | List (role-filtered) |
| GET | `/orders/:id` | Yes | Any | Detail + events |
| POST | `/orders/:id/dispatch` | Yes | MERCHANT | Dispatch |
| POST | `/orders/:id/confirm-delivery` | Yes | BUYER | OTP confirm |
| POST | `/orders/:id/cancel` | Yes | Any | Cancel |
| POST | `/orders/:id/dispute` | Yes | BUYER | Dispute |

### Payment
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/payments/initialize` | Yes | BUYER | Start payment |
| POST | `/payments/webhook` | **No** | — | Paystack webhook |

### Inventory
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/inventory/:productId` | Yes | MERCHANT | Stock level |
| POST | `/inventory/adjust` | Yes | MERCHANT | Manual adjust |

### Notification
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/notifications` | Yes | Any | List |
| PATCH | `/notifications/:id/read` | Yes | Any | Mark read |
| GET | `/notifications/unread-count` | Yes | Any | Unread count |

---

## 18. Dev A vs Dev B Task Split

### Dev A (Backend Lead) Owns:

| Module | What To Build |
|--------|--------------|
| **Infrastructure** | Monorepo scaffold, Prisma schema, migrations, Redis/BullMQ setup, Docker, deployment |
| **Auth** | Full implementation: register, login, refresh, logout, JWT strategies, guards, middleware |
| **Order** | State machine logic, all transitions, OTP generation/verification, OrderEvent logging |
| **Payment** | Paystack client, initialize, webhook handler, signature verification, payout, idempotency |

### Dev B (Fullstack) Owns:

| Module | What To Build |
|--------|--------------|
| **Merchant** | Profile CRUD, onboarding steps, public profile |
| **Product** | Full CRUD, soft delete, catalogue query, search |
| **RFQ** | Create, list, cancel, expiry cron job |
| **Quote** | Submit, accept (with transaction), decline, expiry check |
| **Inventory** | Event append, stock cache, reserve/release, manual adjustment |
| **Notification** | Trigger service, BullMQ processor, email service, CRUD |

### Handoff Points:

1. **Dev A finishes Auth → Dev B can start building protected endpoints**
2. **Dev B finishes Quote accept → needs Dev A's OrderService.createFromQuote()**
3. **Dev A finishes Payment → Dev B wires notification triggers for payment events**
4. **Dev B stubs Order/Payment APIs by Day 5 so Dev C (frontend) isn't blocked**

---

## 19. Common Pitfalls & Rules

### The 10 Commandments

1. **Never mutate inventory directly.** Always append an InventoryEvent.
2. **Never skip the state machine.** All order transitions go through `validateTransition()`.
3. **Never trust the frontend.** Validate everything server-side with DTOs.
4. **Never process a webhook without signature verification.** Even in dev.
5. **Never query merchant data without merchantId filter.** Data leaks kill trust.
6. **Never store money as float.** BigInt kobo only. Use shared `money.ts` utils.
7. **Never put business logic in controllers.** Controllers delegate to services.
8. **Never skip the transaction.** Quote acceptance creates multiple records atomically.
9. **Never return raw Prisma errors to clients.** GlobalExceptionFilter formats them.
10. **Never add features not in the V1 scope.** If it's not in this doc, it doesn't exist.

### Common Mistakes

| Mistake | Why It's Bad | Fix |
|---------|-------------|-----|
| Forgetting `deletedAt: null` in queries | Shows deleted products to buyers | Always include in WHERE clause |
| Using `Number` instead of `BigInt` for money | Loses precision on large amounts | Use `BigInt` everywhere, convert only for display |
| Not checking quote expiry before accepting | Buyer accepts quote after merchant's price expired | Check `validUntil > now()` before accepting |
| Hardcoding Paystack secret in code | Secret leaks to git | Always use `process.env` via ConfigService |
| Missing `await` on Prisma calls | Query doesn't execute, returns Promise | Always await database operations |
| Not returning from guard/filter | Request continues despite failed auth | Return false or throw exception |

---

## 20. Local Development Setup

### First Time Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd hardware-os

# 2. Install dependencies
pnpm install

# 3. Start databases
docker-compose up -d

# 4. Set up environment
cp .env.example apps/backend/.env
# Edit apps/backend/.env with your Paystack test keys

# 5. Run migrations
cd apps/backend
npx prisma migrate dev
npx prisma db seed

# 6. Start backend
pnpm --filter @hardware-os/backend dev
# Backend runs on http://localhost:4000

# 7. Start frontend (separate terminal)
pnpm --filter @hardware-os/web dev
# Frontend runs on http://localhost:3000

# 8. Verify
curl http://localhost:4000/health
# Should return: { "status": "ok", "db": true, "redis": true }
```

### Useful Commands

```bash
# Build everything
pnpm build

# Build specific package
pnpm --filter @hardware-os/backend build

# Run backend tests
pnpm --filter @hardware-os/backend test

# Open Prisma Studio (visual database browser)
cd apps/backend && npx prisma studio

# Generate Prisma client after schema change
cd apps/backend && npx prisma generate

# Create new migration
cd apps/backend && npx prisma migrate dev --name <migration-name>

# Reset database (drops all data)
cd apps/backend && npx prisma migrate reset

# Check for Paystack webhooks locally
# Install Paystack CLI, then:
paystack listen --forward-to localhost:4000/payments/webhook
```

---

**This document is your single source of truth for backend development. If something isn't in here, it's not in V1. If something contradicts the code, this document wins — fix the code.**
