# Swifta — Backend

NestJS modular monolith API server for Swifta.

---

## Tech Stack

- **NestJS** (Express adapter) — framework
- **Prisma** — ORM and migrations
- **PostgreSQL 16** — database (Supabase-managed in prod)
- **Redis 7** — sessions + job queue
- **BullMQ** — async background jobs
- **Paystack** — payment processing
- **Passport + JWT** — authentication

---

## Getting Started

```bash
# From monorepo root
docker-compose up -d                         # Start Postgres + Redis
cp .env.example apps/backend/.env            # Configure environment
cd apps/backend
npx prisma migrate dev                       # Run migrations
npx prisma db seed                           # Seed test data
pnpm dev                                     # Start on http://localhost:4000
```

---

## Project Structure

```
src/
├── main.ts                    # App bootstrap (CORS, helmet, validation pipe)
├── app.module.ts              # Root module — imports all domain modules
│
├── config/                    # Environment variable loading
│   ├── app.config.ts          # PORT, NODE_ENV, FRONTEND_URL
│   ├── database.config.ts     # DATABASE_URL
│   ├── redis.config.ts        # REDIS_URL
│   ├── paystack.config.ts     # Paystack keys
│   └── jwt.config.ts          # JWT secrets and TTLs
│
├── common/                    # Cross-cutting concerns
│   ├── decorators/            # @CurrentUser, @CurrentMerchant, @Roles, @IdempotencyKey
│   ├── guards/                # JwtAuthGuard, RolesGuard, MerchantVerifiedGuard
│   ├── middleware/            # MerchantContextMiddleware (extracts merchantId from JWT)
│   ├── filters/               # GlobalExceptionFilter (consistent error responses)
│   ├── pipes/                 # ValidationPipe (auto DTO validation)
│   └── interceptors/          # ResponseTransformInterceptor (wraps in ApiResponse)
│
├── prisma/                    # Database
│   ├── schema.prisma          # 13 models — source of truth
│   ├── seed.ts                # Test data
│   └── migrations/            # Migration history
│
├── redis/                     # Redis client module
├── queue/                     # BullMQ registration
├── health/                    # GET /health endpoint
│
└── modules/                   # Domain modules (all business logic)
    ├── auth/                  # Register, login, JWT, refresh, logout
    ├── merchant/              # Profile CRUD, onboarding
    ├── product/               # Product CRUD, catalogue, soft delete
    ├── rfq/                   # RFQ creation, expiry cron, cancellation
    ├── quote/                 # Submit, accept (atomic transaction), decline
    ├── order/                 # State machine, dispatch, OTP, event logging
    ├── payment/               # Paystack init, webhook, verify, payout
    ├── inventory/             # Event append, stock cache, reserve/release
    └── notification/          # Trigger service, BullMQ processor, email
```

---

## Domain Modules

### Module Dependency Flow

```
Auth → Merchant/Product → RFQ → Quote → Order → Payment
                                                   │
Notification ← called by all modules ──────────────┘
Inventory ← called by Quote + Order
```

No circular dependencies. Dependencies flow one direction.

### Module Responsibilities

| Module           | Exports                    | Key Endpoints                                                                 |
| ---------------- | -------------------------- | ----------------------------------------------------------------------------- |
| **Auth**         | —                          | `POST /auth/register, login, refresh, logout`                                 |
| **Merchant**     | MerchantService            | `GET/PATCH /merchants/me`, `GET /merchants/:id`                               |
| **Product**      | ProductService             | `CRUD /products`, `GET /products/catalogue`                                   |
| **RFQ**          | RFQService                 | `POST /rfqs`, `GET /rfqs`, `GET /rfqs/merchant`                               |
| **Quote**        | —                          | `POST /quotes`, `POST /quotes/:id/accept\|decline`                            |
| **Order**        | OrderService               | `GET /orders`, `POST /orders/:id/dispatch\|confirm-delivery\|cancel\|dispute` |
| **Payment**      | —                          | `POST /payments/initialize`, `POST /payments/webhook`                         |
| **Inventory**    | InventoryService           | `GET /inventory/:productId`, `POST /inventory/adjust`                         |
| **Notification** | NotificationTriggerService | `GET /notifications`, `PATCH /notifications/:id/read`                         |

---

## Database

### Models (13 total)

User, MerchantProfile, Product, RFQ, Quote, Order, OrderEvent, Payment, PaymentEvent, InventoryEvent, ProductStockCache, Notification

### Key Rules

- All IDs: UUID v4
- All money: BigInt in kobo (₦1 = 100 kobo)
- Append-only tables: OrderEvent, PaymentEvent, InventoryEvent — NO updates, NO deletes
- Inventory: never mutated directly, derived from events
- Table names: snake_case via `@@map()`
- All foreign keys have `@@index()`

### Commands

```bash
npx prisma studio              # Visual DB browser
npx prisma migrate dev         # Create + apply migration
npx prisma generate            # Regenerate client
npx prisma migrate reset       # Drop + recreate DB
npx prisma db seed             # Seed test data
npx prisma validate            # Validate schema
```

---

## Order State Machine

```
PENDING_PAYMENT → PAID → DISPATCHED → DELIVERED → COMPLETED
       ↓           ↓         ↓
   CANCELLED   CANCELLED   DISPUTE
```

| From            | To         | Triggered By                   |
| --------------- | ---------- | ------------------------------ |
| PENDING_PAYMENT | PAID       | System (Paystack webhook)      |
| PENDING_PAYMENT | CANCELLED  | Buyer                          |
| PAID            | DISPATCHED | Merchant (generates OTP)       |
| PAID            | CANCELLED  | Merchant (triggers refund)     |
| DISPATCHED      | DELIVERED  | Buyer (OTP verified)           |
| DISPATCHED      | DISPUTE    | Buyer                          |
| DELIVERED       | COMPLETED  | System (auto, triggers payout) |

Enforced by `order-state-machine.ts`. Every transition creates an OrderEvent.

---

## Payment Flow (Paystack)

1. `POST /payments/initialize` → calls Paystack API, returns authorization URL
2. Frontend opens Paystack popup → buyer pays
3. Paystack sends `POST /payments/webhook` → HMAC-SHA512 verified
4. Backend verifies via Paystack verify API → updates Payment + Order
5. On delivery confirmation → Paystack Transfer API pays merchant

**Idempotency:**

- Initialize: keyed on orderId (same order → same reference)
- Webhook: checks if already SUCCESS (duplicates ignored)
- Payout: keyed on orderId + PAYOUT direction (one payout per order)

**Webhook endpoint has NO JWT guard** — protected by signature verification only.

---

## Authentication

- Access token: JWT, 15 min TTL, contains `{ sub, email, role, merchantId }`
- Refresh token: JWT, 7 day TTL, stored in Redis, rotated on use
- Logout: deletes refresh token from Redis
- Guards: `JwtAuthGuard` → `RolesGuard` → `MerchantVerifiedGuard`
- `MerchantContextMiddleware`: extracts merchantId from JWT, attaches to request

---

## API Response Format

**Success:**

```json
{ "success": true, "data": { ... } }
```

**Paginated:**

```json
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 47 } }
```

**Error:**

```json
{ "error": "Quote has expired", "code": "QUOTE_EXPIRED", "statusCode": 400 }
```

---

## Notification Triggers

| Event              | Recipients |
| ------------------ | ---------- |
| New RFQ            | Merchant   |
| Quote submitted    | Buyer      |
| Quote accepted     | Merchant   |
| Quote declined     | Merchant   |
| RFQ expired        | Buyer      |
| Payment confirmed  | Both       |
| Order cancelled    | Both       |
| Order dispatched   | Buyer      |
| Delivery confirmed | Merchant   |
| Payout initiated   | Merchant   |

---

## Testing

```bash
pnpm test                      # Unit tests
pnpm test:e2e                  # End-to-end tests

# Paystack webhook testing
paystack listen --forward-to localhost:4000/payments/webhook

# Test card: 4084 0840 8408 4081 (any expiry, any CVV, OTP: 123456)
```

---

## Rules

1. Never mutate inventory directly — always append an InventoryEvent
2. Never skip the state machine — use `validateTransition()`
3. Never query merchant data without merchantId filter
4. Never store money as float — BigInt kobo only
5. Never put business logic in controllers — delegate to services
6. Never process webhooks without signature verification
7. Never return raw Prisma errors — GlobalExceptionFilter formats them
