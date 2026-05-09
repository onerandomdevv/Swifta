# twizrr

**Nigeria's WhatsApp-native e-commerce platform**

twizrr is a social commerce marketplace where buyers discover products, follow merchants, pay through escrow, and confirm delivery from WhatsApp or the web. Merchants manage listings, orders, payouts, and customer updates from the dashboard and supported chat channels.

Website: [twizrr.com](https://twizrr.com)

---

## What is twizrr?

twizrr combines a social product feed, merchant storefronts, WhatsApp commerce, escrow payments, delivery confirmation, ratings, and automated merchant payouts.

The platform currently supports two main user-facing channels:

- **WhatsApp**: buyer, merchant, and supplier flows for search, onboarding, order updates, payment guidance, delivery confirmation, and product discovery.
- **Web**: Next.js app for product discovery, authentication, dashboards, merchant tools, and platform administration.

Every escrow transaction keeps buyer funds protected until delivery is confirmed. Once the confirmation flow completes, payout processing moves money to the merchant through Paystack.

---

## How It Works

### Buyers

1. Browse the feed or search for a product.
2. Follow merchants and discover products from trusted sellers.
3. Buy directly or add products to cart.
4. Pay securely through Paystack.
5. Track delivery updates through the app and WhatsApp.
6. Confirm delivery with OTP.
7. Review the merchant after completion.

### Merchants

1. Create a merchant profile and storefront.
2. Add products, images, stock, prices, and categories.
3. Receive orders and notifications.
4. Dispatch orders and update delivery state.
5. Receive payout after buyer confirmation or auto-confirmation.

### WhatsApp

The WhatsApp channel supports:

- Text search and intent-based product discovery.
- Image search through AI and catalogue matching.
- Buyer authentication and onboarding flows.
- Merchant onboarding and operational commands.
- Supplier-oriented flows.
- Interactive messages through Meta WhatsApp Cloud API.

---

## Key Features

- **Social commerce feed**: product discovery with merchant profiles and follow mechanics.
- **Escrow payments**: Paystack-backed checkout and payment verification.
- **Ledger module**: append-only money movement tracking for stable financial operations.
- **Merchant payouts**: payout orchestration through Paystack transfers.
- **WhatsApp commerce**: dedicated channel layer for buyer, merchant, supplier, and shared WhatsApp flows.
- **AI integrations**: Gemini and Google Vision clients isolated under the integrations layer.
- **Image search**: WhatsApp product image recognition and catalogue matching.
- **Verified merchants**: trust and verification workflows.
- **Ratings and reviews**: post-delivery feedback and review processing.
- **Queues and webhooks**: BullMQ workers for reminders, review prompts, auto-confirmation, payouts, and webhook-backed payment flows.

---

## Monorepo Structure

```text
twizrr/
├── apps/
│   ├── backend/              # NestJS API, workers, channels, integrations
│   └── web/                  # Next.js App Router frontend
├── packages/
│   └── shared/               # Shared TypeScript types, enums, constants, utilities
├── turbo.json                # Turborepo task config
├── pnpm-workspace.yaml       # Workspace package config
├── docker-compose.yml        # Local services
└── README.md
```

### Backend Architecture

```text
apps/backend/src/
├── app.module.ts             # Thin root module
├── core/                     # Global infrastructure wiring
├── domains/                  # Domain composition modules
├── channels/                 # External/user-facing channels
│   ├── whatsapp/
│   └── ussd/
├── integrations/             # Third-party provider clients
│   ├── africastalking/
│   ├── ai/
│   ├── cloudinary/
│   ├── meta-whatsapp/
│   ├── paystack/
│   └── resend/
├── modules/                  # Business modules
│   ├── auth/
│   ├── ledger/
│   ├── order/
│   ├── payment/
│   ├── payout/
│   └── ...
├── queue/                    # BullMQ processors and queue registration
├── prisma/                   # Prisma service and database utilities
└── config/                   # Config namespaces and env validation
```

The backend now separates responsibilities into:

- **Core layer**: global NestJS setup, config, cache, scheduling, static files, throttling, Prisma, and Redis.
- **Domain layer**: grouped business domains for commerce, money, users/trust, and channels.
- **Channels layer**: WhatsApp and USSD entry points kept outside business modules.
- **Integrations layer**: Paystack, Cloudinary, Resend, Africa's Talking, Meta WhatsApp, Gemini, and Google Vision clients.
- **Modules layer**: business logic for auth, orders, payments, payouts, ledger, merchants, uploads, reviews, logistics, and related features.

More backend architecture notes live in:

- `apps/backend/src/domains/README.md`
- `apps/backend/src/integrations/README.md`
- `apps/backend/docs/STABILITY_ROADMAP.md`
- `apps/backend/prisma/MIGRATIONS.md`

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, Tailwind CSS, React Query, React Hook Form, Zod |
| Backend | NestJS 10, TypeScript, Prisma ORM |
| Database | PostgreSQL on Neon |
| Cache and Queues | Redis, BullMQ |
| Payments | Paystack checkout, transfers, webhooks, bank resolution |
| Messaging | Meta WhatsApp Business Cloud API, Africa's Talking |
| AI | Google Gemini, Google Cloud Vision |
| Email | Resend |
| Image CDN | Cloudinary |
| Monorepo | pnpm workspaces, Turborepo |

---

## Important Backend Services

- **Paystack**: payment initialization, verification, webhook handling, bank resolution, transfer recipients, and payouts.
- **Ledger**: financial event recording and idempotency support for money movement.
- **Meta WhatsApp**: outbound messages, interactive WhatsApp responses, and channel delivery.
- **Gemini and Google Vision**: buyer intent parsing and image search support.
- **Cloudinary**: product image upload, delivery, and transformation helpers.
- **Resend**: transactional email delivery.
- **Africa's Talking**: SMS and USSD-related provider integration.
- **Redis and BullMQ**: background jobs for checkout reminders, review prompts, auto-confirmation, webhook processing, and payout workflows.

---

## User Roles

| Role | Access |
| --- | --- |
| Buyer | Browse products, purchase, track orders, confirm delivery, review merchants |
| Merchant | Manage storefront, products, orders, dispatch, payouts, and buyer interactions |
| Supplier | Supplier-side commerce flows and WhatsApp-assisted operations |
| Super Admin | Platform administration and privileged management |
| Operator | Internal operational support |
| Support | Customer and merchant support workflows |

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 8
- Docker Desktop, if using local services
- PostgreSQL connection string
- Redis connection string

### Setup

```bash
git clone <repository_url>
cd twizrr

pnpm install
docker-compose up -d
```

Create the required environment files:

- Copy `apps/backend/.env.example` to `apps/backend/.env`.
- Copy `apps/web/.env.example` to `apps/web/.env.local`.

Backend values must include `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, JWT secrets, `ONBOARDING_OTP_SECRET`, Paystack keys, Cloudinary keys, `RESEND_API_KEY`, Africa's Talking keys, Gemini/Google Vision keys, and WhatsApp provider keys.

```bash
cd apps/backend
pnpm exec prisma migrate dev
pnpm exec prisma db seed
cd ../..
```

Start the apps:

```bash
pnpm --filter @twizrr/backend dev
pnpm --filter @twizrr/web dev
```

Backend: `http://localhost:4000`

Frontend: `http://localhost:3000`

---

## Verification

Backend verification:

```bash
cd apps/backend
pnpm run lint
npx tsc --noEmit
pnpm run build
```

The backend build runs Prisma generation before compiling NestJS.

---

## Security and Reliability

- JWT authentication with HttpOnly cookies and refresh-token rotation.
- Role-based access control through guards and decorators.
- Paystack webhook signature verification.
- WhatsApp webhook and provider isolation.
- Required environment validation through Joi.
- Redis-backed token and OTP workflows.
- Append-only inventory and ledger patterns for auditability.
- Idempotency support for webhook and ledger-sensitive operations.
- Queue-based processing for time-based and retryable workflows.

---

## Current Architecture Status

Recent backend architecture work added:

- `core/` module for centralized infrastructure setup.
- `domains/` composition modules for higher-level system boundaries.
- `channels/` layer for WhatsApp and USSD.
- `integrations/` layer for third-party providers.
- `ledger/` module for financial event tracking.
- New Prisma migrations for Neon drift repair, ledger entries, ledger idempotency, and webhook events.
- Documentation for stability and migration handling.

---

## Roadmap

Current focus:

- Stabilize backend architecture and database migrations.
- Keep external integrations isolated and testable.
- Strengthen payment, ledger, webhook, and queue reliability.
- Improve WhatsApp commerce flows for buyers, merchants, and suppliers.

Next:

- Expand admin and support tooling.
- Improve dispute handling.
- Add stronger identity and merchant verification.
- Deepen supplier/B2B workflows.
- Improve observability, alerting, and operational dashboards.

---

## Team

Built by **codedDevs**, a software development team based in Lagos, Nigeria.

- Kareem Aliameen: Product and Engineering Lead
- Yusuf Saheed: CTO and Engineering Lead

Email: codeddevs.team@gmail.com

GitHub: [github.com/coded-devs](https://github.com/coded-devs)

---

## License

Proprietary. All rights reserved.
