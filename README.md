# Swifta

**Nigeria's WhatsApp-Native E-Commerce Platform**

Buy and sell anything on WhatsApp with escrow payment protection. Discover products, follow merchants, and shop securely — all from the app you already use.

🌐 **Website:** [swifta.store](https://swifta.store)
📱 **WhatsApp:** Message Swifta to start shopping

---

## What is Swifta?

Swifta is a social commerce marketplace where buyers discover products through a scrollable feed, follow their favorite merchants, and purchase with escrow-protected payments. Merchants list products, manage orders, and get paid instantly to their bank account.

The platform works on two channels:
- **WhatsApp** — the primary channel for buyers. Search, buy, pay, track, and confirm delivery without leaving WhatsApp.
- **Web** — a social media-style product feed for discovery, plus full dashboards for merchants to manage their business.

Every transaction is protected by escrow. The buyer's money is held securely until they confirm delivery with an OTP code. No trust required — the system handles it.

---

## How It Works

### For Buyers

1. Browse the product feed or search for what you need
2. Follow (star) merchants you like — their products appear in your personalized feed
3. Tap **Buy Now** or add to cart
4. Pay securely via Paystack — your money is held in escrow
5. Track your delivery in real-time
6. Enter your OTP code to confirm receipt
7. Merchant gets paid. Rate your experience.

### For Merchants

1. Create your business page with a unique username
2. List products with photos, prices, and descriptions
3. Receive orders with instant WhatsApp notifications
4. Pack and dispatch — buyer gets tracking updates
5. Money lands in your bank account automatically after delivery confirmation

### On WhatsApp

Buyers can do everything through the Swifta WhatsApp AI assistant:
- **Text search:** "I need a phone case" → get matching products
- **Image search:** Send a photo of any product → AI identifies it and finds matches
- **Purchase:** Select, pay, track, and confirm — all in the chat
- **Merchant management:** Merchants check sales, update prices, and dispatch orders via WhatsApp

---

## Key Features

**Social Commerce Feed** — Instagram-style scrollable product feed. Follow merchants. Discover products. Buy in one tap.

**Escrow Payments** — Buyer's money is protected until delivery is confirmed via OTP. Powered by Paystack.

**WhatsApp AI Assistant** — Three specialized bots (buyer, merchant, supplier) powered by Google Gemini with function-calling for intent parsing.

**AI Image Search** — Send a product photo via WhatsApp. Google Cloud Vision identifies it, searches the catalogue, and returns matching products.

**Instant Bank Payouts** — Delivery confirmed → merchant's money is automatically transferred to their bank account via Paystack Transfers.

**Verified Merchants** — Tiered verification system (Unverified → Basic → Verified → Trusted) with document review and performance tracking.

**Multi-Category Marketplace** — Electronics, Fashion, Building Materials, Home & Kitchen, Health & Beauty, Auto Parts, Agriculture, Food & Groceries, and more.

**Ratings & Reviews** — Post-delivery review prompts via WhatsApp. Merchant ratings displayed on profiles and product cards.

**Real-Time Tracking** — Order status updates pushed to buyer via WhatsApp and in-app notifications.

**Business Pages** — Every merchant gets a shareable profile page with their products, ratings, and verification status.

---

## Tech Stack

### Architecture

```
swifta/
├── apps/
│   ├── backend/          → NestJS 10 modular API
│   └── web/              → Next.js 14 App Router
├── packages/
│   └── shared/           → Shared TypeScript types, DTOs, enums
├── docker-compose.yml    → Local PostgreSQL & Redis
└── pnpm-workspace.yaml   → Monorepo workspace config
```

### Core Technologies

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, React Query, React Hook Form, Zod |
| Backend | NestJS 10, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 (Supabase managed) |
| Cache & Queues | Redis (Upstash) + BullMQ |
| Payments | Paystack (Checkout, Transfers, Webhooks, Bank Resolution) |
| Messaging | Meta WhatsApp Business Cloud API (Interactive Messages) |
| AI | Google Gemini 2.0 Flash (intent parsing), Google Cloud Vision (image search) |
| Email | Resend |
| SMS | Africa's Talking |
| Image CDN | Cloudinary (with auto-optimization transforms) |
| Monitoring | Sentry (error tracking), Vercel Speed Insights |
| Deployment | Vercel (frontend), Render (backend), Supabase (database), Upstash (Redis) |

### Key Architecture Decisions

- **Monorepo** with Turborepo and pnpm workspaces
- **Append-only event tables** for inventory tracking (InventoryEvent → ProductStockCache)
- **All money stored as BigInt** (kobo) — no floating-point currency math
- **UUID primary keys** everywhere
- **BullMQ** for async job processing (payouts, notifications, auto-confirmation timers)
- **JWT authentication** with role-based access control (roles: Buyer, Merchant, Supplier)
- **Paystack webhook signature verification** on all payment callbacks
- **WhatsApp function-calling only** — AI can call predefined functions, never generates free-form responses to users

---

## User Roles

| Role | Access |
|------|--------|
| **Buyer** | Browse catalogue, purchase products, track orders, rate merchants |
| **Merchant** | List products, manage orders, receive payouts, manage business page. Can toggle to buyer mode to purchase from other merchants |
| **Supplier** | Wholesale product management, merchant orders (B2B — coming soon) |

---

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 8 (`npm install -g pnpm`)
- Docker Desktop (for local PostgreSQL & Redis)

### Setup

```bash
# Clone the repository
git clone <repository_url>
cd swifta

# Install dependencies
pnpm install

# Start local database and Redis
docker-compose up -d

# Set up environment variables
# Copy .env.example to .env in apps/backend and apps/web
# Fill in: Paystack keys, database URL, Redis URL, Gemini API key, etc.

# Run database migrations and seed
cd apps/backend
npx prisma migrate dev
npx prisma db seed
cd ../..

# Start development servers
pnpm --filter @swifta/backend dev    # Backend → http://localhost:4000
pnpm --filter @swifta/web dev        # Frontend → http://localhost:3000
```

---

## Security

- **Escrow payment protection** — buyer funds held until OTP-verified delivery
- **JWT authentication** with HttpOnly cookies and refresh token rotation
- **Role-based access control** with guard decorators on every endpoint
- **Paystack webhook signature verification** on all payment callbacks
- **WhatsApp AI guardrails** — function-calling only, no free-form AI responses
- **Rate limiting** via @nestjs/throttler on API endpoints
- **Input sanitization** against XSS on all user inputs
- **Staff access token system** — operators onboarded via secure token-based workflow
- **Audit logging** on admin actions

---

## Roadmap

**Current (V5):** Social commerce marketplace with WhatsApp AI, escrow payments, multi-category catalogue, ratings, and merchant business pages.

**Next (V6):** Security hardening (Prembly identity verification), Paystack Dedicated Virtual Accounts (eliminate payment link browser hop), dispute resolution center, admin dashboard upgrades, price intelligence, dark mode.

**Future:** B2B supplier marketplace, trade financing, SwiftCoins loyalty program, group buying, Remotion video generation for merchant marketing.

---

## Team

Built by **codedDevs** — a software development team based in Lagos, Nigeria.

- **Kareem Aliameen** — CEO & Product & Engineering Lead
- **Yusuf Saheed** — CTO & Engineering Lead
- **Amoo Mustakheem** — CDO & Business Development

📧 codeddevs.team@gmail.com
🐙 [github.com/coded-devs](https://github.com/coded-devs)

---

## License

Proprietary. All rights reserved.