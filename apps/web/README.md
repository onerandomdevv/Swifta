# Swifta — Frontend

Next.js 14 App Router web application for Swifta.

---

## Tech Stack

- **Next.js 14** (App Router) — framework
- **TypeScript** — type safety
- **Tailwind CSS** — styling
- **@swifta/shared** — shared types, enums, money utilities

---

## Getting Started

```bash
# From monorepo root (backend must be running)
cd apps/web
cp .env.example .env.local     # Or create manually
pnpm dev                       # Start on http://localhost:3000
```

### Environment Variables (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PAYSTACK_KEY=pk_test_xxxxx
```

---

## Project Structure

```
src/
├── app/                          # Pages (file-based routing)
│   ├── layout.tsx                # Root layout (providers, fonts, global CSS)
│   ├── page.tsx                  # Landing → redirect to dashboard or login
│   ├── loading.tsx               # Global loading skeleton
│   ├── not-found.tsx             # 404 page
│   ├── error.tsx                 # Error boundary
│   │
│   ├── (auth)/                   # Auth pages (no sidebar)
│   │   ├── layout.tsx            # Centered card layout
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify-email/page.tsx
│   │
│   └── (dashboard)/              # Dashboard pages (sidebar + header)
│       ├── layout.tsx            # Auth check + sidebar + header
│       ├── merchant/             # 10 merchant pages
│       │   ├── dashboard/
│       │   ├── onboarding/
│       │   ├── products/         # list, new, [id]/edit
│       │   ├── rfqs/             # list, [id] (with quote form)
│       │   ├── orders/           # list, [id] (dispatch + OTP)
│       │   └── inventory/
│       └── buyer/                # 7 buyer pages
│           ├── dashboard/
│           ├── catalogue/
│           ├── rfqs/             # list, new, [id] (with quote review)
│           └── orders/           # list, [id] (pay + OTP confirm)
│
├── components/
│   ├── ui/                       # Generic primitives (13 components)
│   │   ├── button.tsx            # Variants: primary, secondary, danger, ghost
│   │   ├── input.tsx             # Label + error state
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx             # isOpen, onClose, title
│   │   ├── toast.tsx             # Auto-dismiss 5s
│   │   ├── skeleton.tsx          # Animated loading placeholder
│   │   ├── empty-state.tsx       # "Nothing here yet" + action
│   │   ├── data-table.tsx
│   │   ├── pagination.tsx
│   │   └── status-badge.tsx      # Color-coded by status enum
│   │
│   ├── layout/                   # Layout components
│   │   ├── sidebar.tsx           # Role-aware navigation
│   │   ├── header.tsx            # User info + notification bell
│   │   ├── mobile-nav.tsx        # Hamburger menu
│   │   └── page-header.tsx       # Title + action button
│   │
│   ├── auth/                     # login-form, register-form, role-select
│   ├── merchant/                 # onboarding-stepper, product-form, quote-form, etc.
│   ├── buyer/                    # catalogue-grid, rfq-form, payment-button, otp-input, etc.
│   ├── order/                    # order-status-timeline, order-summary-card, order-list-item
│   └── notification/             # notification-bell, dropdown, item
│
├── lib/
│   ├── api-client.ts             # Centralized HTTP client (auto JWT, error handling)
│   ├── api/                      # 9 API modules (one per backend module)
│   │   ├── auth.api.ts
│   │   ├── merchant.api.ts
│   │   ├── product.api.ts
│   │   ├── rfq.api.ts
│   │   ├── quote.api.ts
│   │   ├── order.api.ts
│   │   ├── payment.api.ts
│   │   ├── inventory.api.ts
│   │   └── notification.api.ts
│   ├── paystack.ts               # Paystack inline popup helper
│   └── utils.ts                  # cn(), formatDate(), formatCurrency()
│
├── hooks/
│   ├── use-auth.ts               # Auth context consumer
│   ├── use-current-user.ts       # User + role
│   ├── use-notifications.ts      # Polls unread count every 60s
│   └── use-debounce.ts           # Search input debounce
│
├── providers/
│   ├── auth-provider.tsx         # Stores tokens in memory, auto-refresh
│   ├── toast-provider.tsx        # Toast notifications
│   └── query-provider.tsx        # Data fetching (optional)
│
└── styles/
    └── globals.css               # Tailwind directives
```

---

## Pages (20 total)

### Auth (3 pages)

| Route           | Purpose                        |
| --------------- | ------------------------------ |
| `/login`        | Email + password login         |
| `/register`     | Role selection + registration  |
| `/verify-email` | Email verification placeholder |

### Merchant (10 pages)

| Route                          | Purpose                                                |
| ------------------------------ | ------------------------------------------------------ |
| `/merchant/dashboard`          | Quick stats, recent RFQs and orders                    |
| `/merchant/onboarding`         | Multi-step form: business info → bank details → review |
| `/merchant/products`           | Own product list with add/edit/delete                  |
| `/merchant/products/new`       | Create product form                                    |
| `/merchant/products/[id]/edit` | Edit product form                                      |
| `/merchant/rfqs`               | Incoming RFQ inbox                                     |
| `/merchant/rfqs/[id]`          | RFQ detail + quote submission form                     |
| `/merchant/orders`             | Order list                                             |
| `/merchant/orders/[id]`        | Order detail + dispatch button + OTP display           |
| `/merchant/inventory`          | Stock levels + manual adjustment                       |

### Buyer (7 pages)

| Route                | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `/buyer/dashboard`   | Active RFQs + pending orders                        |
| `/buyer/catalogue`   | Browse all products, search, "Request Quote" button |
| `/buyer/rfqs`        | Own RFQ list                                        |
| `/buyer/rfqs/new`    | Create RFQ form                                     |
| `/buyer/rfqs/[id]`   | RFQ detail + quote accept/decline                   |
| `/buyer/orders`      | Order list                                          |
| `/buyer/orders/[id]` | Order detail + pay button + OTP delivery confirm    |

---

## API Communication

All backend calls go through the centralized API layer:

```
Component → lib/api/*.api.ts → lib/api-client.ts → Backend
```

**Never use `fetch()` directly in components.** Always use the API functions.

The API client automatically:

- Adds `Authorization: Bearer <token>` header
- Parses JSON responses
- Throws typed errors with `{ error, code, statusCode }`

---

## Authentication

- Tokens stored in **React state (memory)** via AuthProvider — NOT localStorage
- Access token: 15 min TTL, auto-refreshed before expiry
- Route protection: dashboard layout redirects to `/login` if not authenticated
- Role guards: merchant layout redirects buyers, buyer layout redirects merchants

---

## Money Display

All money from the API arrives in **kobo** (integer). Always convert for display:

```typescript
import { formatKobo } from "@swifta/shared";

formatKobo(650000n); // "₦6,500.00"
formatKobo(32500000n); // "₦325,000.00"
```

When user types Naira in forms, convert to kobo before sending to API:

```typescript
import { nairaToKobo } from "@swifta/shared";

nairaToKobo(6500); // 650000n
```

---

## Key Rules

1. **No prices on product cards** — products don't have prices (business rule)
2. **Don't update order status after payment** — backend does it via webhook; poll until status changes
3. **Don't show delivery OTP to buyer** — only merchant sees OTP
4. **Don't store tokens in localStorage** — memory only (AuthProvider)
5. **Don't use fetch() in components** — use the API layer
6. **Every page must handle**: loading state, empty state, error state
7. **Responsive design** — must work on mobile (sidebar → hamburger menu)

---

## Design System

| Token             | Value                  |
| ----------------- | ---------------------- |
| Primary           | `#1B2A4A` (navy)       |
| Accent            | `#2E75B6` (blue)       |
| Action            | `#E87722` (orange)     |
| Sidebar           | `w-64` (256px)         |
| Header            | `h-16` (64px)          |
| Card              | `rounded-lg shadow-sm` |
| Mobile breakpoint | `md:` (768px)          |
