# SwiftTrade / HARDWARE OS

**The Operating System for Lagos Hardware Trade**

How HARDWARE OS digitizes Africa's largest informal hardware trade network without breaking the trust, negotiation, and relationships that make it work.

---

## 🚀 The Vision: Beyond a Marketplace

SwiftTrade is not your typical B2B e-commerce platform. It is a purpose-built trade infrastructure designed specifically for the realities of the Lagos hardware market (cement, iron rods, plumbing, electrical, etc.).

Generic platforms fail because they don't understand how this billion-naira industry operates. We don't force generic e-commerce models onto a relationship-driven industry. Instead, we digitize the transaction lifecycle while empowering merchants to maintain their pricing strategies and customer relationships.

**Why SwiftTrade Works:**

- **Price Opacity by Design:** Prices are negotiated privately via an RFQ (Request for Quote) model.
- **Embedded Trust:** Buyer's payment is held in escrow until delivery is confirmed via OTP. The merchant is guaranteed payment; the buyer is guaranteed delivery.
- **Data Privacy:** Merchant inventory, pricing, and sales data are siloed and strictly confidential.
- **Behavioral Trade History:** Every successful transaction builds a verifiable trade profile, laying the groundwork for future credit scoring and working capital (BNPL).

## 💡 Core Features (V1)

### 1. Unified Trade Lifecycle

- **Merchant Onboarding & Verification:** Merchants register and undergo verification (CAC, Bank, Address) for a secure ecosystem.
- **Private Product Catalogue:** Merchants list their products without prices. Buyers browse the unified platform catalogue to discover suppliers.
- **RFQ Flow & Negotiation:** Buyers request quotes for specific volumes and locations. Merchants respond with private unit pricing and delivery fees. You can seamlessly transition to WhatsApp to close deals.
- **Secure Escrow Payments:** Integrated with **Paystack** for seamless cards and bank transfers. Funds are securely held.
- **OTP-Secured Delivery Confirmation:** The merchant generates a 6-digit OTP given to the driver. The buyer must provide this OTP to confirm receipt, releasing funds to the merchant automatically.

### 2. Comprehensive Dashboards

- **Merchant Portal:** A command center for managing product listings, responding to RFQs, tracking orders, managing inventory, and requesting payouts.
- **Buyer Portal:** An intuitive interface to discover products, send RFQs, track order status, and view trusted merchant profiles.
- **Super Admin Platform:** A robust backend for operational oversight. Features include:
  - System-wide analytics and market intelligence (GMV, funnel metrics).
  - Escrow and payout management.
  - Merchant verification queues and manual flags (e.g., CAC, Address).
  - Staff user management with secure **Access Token Generation** for `OPERATOR` and `SUPPORT` roles.

### 3. Trust Profiles & Issue Resolution

- **Merchant Trust Profiles:** Buyers see delivery velocity, response rates, and verification status before initiating trade.
- **Dispute & Issue Reporting:** Built-in safeguards allow buyers to flag issues, managed directly by the Admin Operations team.

---

## 🏗️ Technical Architecture

SwiftTrade is a modular monolith/monorepo architecture optimized for scalability, security, and developer velocity.

```text
hardware-os/
├── apps/
│   ├── backend/          → NestJS modular API server
│   └── web/              → Next.js 14 App Router (Frontend)
├── packages/
│   └── shared/           → Shared Typescript definitions, DTOs, Enums
├── docker-compose.yml    → Local Postgres & Redis
└── pnpm-workspace.yaml   → Monorepo workspace config
```

### Technology Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, React Query, React Hook Form + Zod, Framer Motion.
- **Backend:** NestJS, Prisma ORM, TypeScript.
- **Database:** PostgreSQL 16 (Relational state, structured data - Supabase managed).
- **Cache / Background Jobs:** Redis 7 (OTP limits, rate-limiting, session management, job queuing).
- **Payments:** Paystack API & Webhooks.
- **Notifications & Comm:** Resend (Email), Africa's Talking (SMS OTPs).

---

## 🛠️ Quick Start Guide

### Prerequisites

- Node.js >= 20
- pnpm >= 8 (`npm install -g pnpm`)
- Docker Desktop (for local DB/Redis)

### Setup & Run

```bash
# 1. Clone the repository
git clone <repository_url>
cd hardware-os

# 2. Install Dependencies
pnpm install

# 3. Start Database & Cache
docker-compose up -d

# 4. Environment Variables
# Copy the `.env.example` file to `.env` in both `apps/web` and `apps/backend` and update the necessary keys (e.g., Paystack, DB URLs).

# 5. Database Schema & Seeding
cd apps/backend
npx prisma migrate dev
npx prisma db seed
cd ../..

# 6. Run the Application
pnpm --filter @hardware-os/backend dev    # Starts backend on http://localhost:4000
pnpm --filter @hardware-os/web dev        # Starts frontend on http://localhost:3000
```

---

## 🔒 Security & Access

- **Role-Based Access Control:** Distinct experiences for `BUYER`, `MERCHANT`, `SUPER_ADMIN`, `OPERATOR`, and `SUPPORT`.
- **JWT Authentication:** Secure auth flow utilizing HttpOnly cookies for session persistence and refresh token rotation.
- **Database Isolation:** Enforced data siloing where merchants can only access their individual inventory and sales records.

---

## 🚀 The Future Roadmap

V1 establishes the core transaction loop. The data generated actively paves the way for advanced integrations:

- **Phase 2 (WhatsApp Native):** Deep WhatsApp integration. Merchants will receive and respond to RFQs directly from WhatsApp without app friction.
- **Phase 3 (Credit):** Behavioral Credit Scoring (TradeScore) leading to embedded BNPL and Trade Credit financing.
- **Phase 4 (Market Intelligence):** AI-driven demand forecasting and the creation of a Lagos Hardware Price Index.

Looking ahead, SwiftTrade isn't just about software; it's about providing the market infrastructure that scales Africa's largest informal trade network.
