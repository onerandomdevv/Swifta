# HARDWARE OS — Frontend Lead Developer Guide

**Audience:** Dev C (Frontend Lead)
**Version:** V1 Scope-Frozen
**Last Updated:** February 2026

---

## TABLE OF CONTENTS

1. [Your Role & What You Own](#1-your-role--what-you-own)
2. [How The Product Works (Non-Technical)](#2-how-the-product-works)
3. [Tech Stack You're Using](#3-tech-stack)
4. [Your Folder Structure — Every File Explained](#4-folder-structure)
5. [How Frontend Talks to Backend](#5-how-frontend-talks-to-backend)
6. [Authentication — How It Works In The Frontend](#6-authentication)
7. [The API Layer — Your Gateway to Backend](#7-the-api-layer)
8. [Page-by-Page Build Guide](#8-page-by-page-build-guide)
9. [Component Library — What To Build](#9-component-library)
10. [Paystack Payment Integration](#10-paystack-payment-integration)
11. [Notification System (Frontend Side)](#11-notification-system)
12. [State Management Approach](#12-state-management)
13. [Styling Rules & Design System](#13-styling-rules)
14. [Backend API Response Format](#14-backend-api-response-format)
15. [Every API Endpoint You'll Call](#15-every-api-endpoint)
16. [Data Types & Enums You'll Use](#16-data-types--enums)
17. [Money Display Rules](#17-money-display-rules)
18. [Error Handling in the Frontend](#18-error-handling)
19. [Things That Will Break The Workflow (DON'T DO These)](#19-things-that-will-break-the-workflow)
20. [Your Sprint Timeline Day-by-Day](#20-your-sprint-timeline)
21. [Integration Checkpoints With Backend Team](#21-integration-checkpoints)
22. [Local Development Setup](#22-local-development-setup)

---

## 1. Your Role & What You Own

You are **Dev C — Frontend Lead**. You own everything the user sees and interacts with.

### Files You Own (100% yours)

```
apps/web/                          ← THIS IS YOUR WORLD
├── src/
│   ├── app/                       ← All pages (routes)
│   ├── components/                ← All UI components
│   ├── hooks/                     ← All custom React hooks
│   ├── providers/                 ← All context providers
│   ├── lib/                       ← API client + utilities
│   └── styles/                    ← Global CSS
├── public/                        ← Static assets
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Files You Use But Don't Own

```
packages/shared/                   ← Shared types, enums, constants
                                     Import from here. Never modify without team agreement.
```

### Files You NEVER Touch

```
apps/backend/                      ← Backend code. Hands off.
docker-compose.yml                 ← Infrastructure. Dev A handles this.
```

### Your Responsibilities

- All 20 page files
- All UI components (buttons, inputs, cards, modals, tables)
- All layout components (sidebar, header, mobile nav)
- All feature components (forms, lists, timelines)
- Auth flow UI (login, register, token handling)
- Paystack inline checkout integration
- Notification bell + dropdown
- Responsive design (mobile-friendly)
- Loading states, empty states, error states on every page
- Connecting every page to the backend via the API layer

### What You DON'T Do

- No backend logic
- No database queries
- No direct fetch() calls in components — always use the API layer
- No inventing new API endpoints — use what the backend provides
- No storing sensitive data in localStorage (tokens go in memory + httpOnly cookies)

---

## 2. How The Product Works

Before you build any UI, understand what the user is doing:

### Two Types of Users

**MERCHANT** (sells hardware materials)
- Registers → completes business profile → lists products (cement, rods, etc.)
- Receives RFQs from buyers → sends quotes with prices
- Gets notified when buyer accepts and pays
- Dispatches order → gives OTP to delivery person
- Receives payout to bank account

**BUYER** (purchases hardware materials — contractors, developers)
- Registers → browses product catalogue
- Sends RFQ (Request for Quote) to a merchant for a specific product
- Receives quote with price → accepts or declines
- Pays via Paystack → waits for delivery
- Enters OTP to confirm delivery

### The Flow You're Building UI For

```
MERCHANT SIDE                    BUYER SIDE
─────────────                    ──────────
1. Register                      1. Register
2. Complete onboarding           2. Browse catalogue
3. Add products                  3. Create RFQ for a product
4. See incoming RFQ ←──────────── (RFQ sent to merchant)
5. Submit quote ──────────────→  4. See quote, accept or decline
6. Get notified: accepted        5. Pay via Paystack
7. Get notified: payment done    6. Wait for delivery
8. Click "Dispatch" + see OTP    7. Enter OTP to confirm receipt
9. Get notified: delivery done   8. Done!
10. Receive payout notification
```

### Key Business Rule: NO PUBLIC PRICES

Products DO NOT have a price field. This is intentional, not a bug. Lagos hardware merchants negotiate prices privately. The buyer sees the product name, unit, and description — then sends an RFQ to get a price quote. Never show a price on the catalogue or product card.

---

## 3. Tech Stack

| Tool | What You Use It For |
|------|-------------------|
| **Next.js 14 (App Router)** | Page routing, layouts, server components |
| **TypeScript** | Type safety everywhere |
| **Tailwind CSS** | All styling — utility-first classes |
| **@hardware-os/shared** | Importing types, enums, money utils from shared package |
| **Paystack Inline** | Payment popup — loads via script tag |
| **React Context** | Auth state, toast notifications |
| **Polling (60s)** | Notification unread count — NO WebSockets in V1 |

### What You're NOT Using

- No Redux, no Zustand (React Context + local state is enough for V1)
- No WebSockets (polling only)
- No NextAuth (custom JWT auth)
- No CSS modules (Tailwind only)
- No component library like shadcn/ui or MUI (build your own simple components)

---

## 4. Your Folder Structure — Every File Explained

### Pages (Routes)

Every file inside `app/` becomes a URL route. Next.js App Router uses folders for routing.

```
src/app/
│
├── layout.tsx                    YOUR JOB: Root HTML wrapper
│                                 - Import global CSS
│                                 - Wrap with AuthProvider + ToastProvider
│                                 - Set page title, favicon
│
├── page.tsx                      YOUR JOB: Landing page
│                                 - If logged in → redirect to dashboard
│                                 - If not logged in → redirect to /login
│
├── loading.tsx                   YOUR JOB: Global loading skeleton
│                                 - Shows while pages load
│
├── not-found.tsx                 YOUR JOB: 404 page
│                                 - Friendly "page not found" with link home
│
├── error.tsx                     YOUR JOB: Global error boundary
│                                 - Catches unhandled errors
│                                 - Shows "something went wrong" + retry button
│
├── (auth)/                       ROUTE GROUP: No sidebar, centered layout
│   │
│   ├── layout.tsx                YOUR JOB: Centered card layout
│   │                             - White card on light background
│   │                             - Logo at top
│   │                             - No sidebar, no header
│   │
│   ├── login/
│   │   └── page.tsx              YOUR JOB: Login page
│   │                             - Email + password form
│   │                             - "Don't have an account? Register" link
│   │                             - On submit → call auth.api.login()
│   │                             - On success → store tokens, redirect to dashboard
│   │
│   ├── register/
│   │   └── page.tsx              YOUR JOB: Registration page
│   │                             - Role selection (Buyer / Merchant)
│   │                             - Email, phone, password fields
│   │                             - If Merchant: also businessName field
│   │                             - On submit → call auth.api.register()
│   │                             - On success → redirect to verify-email or dashboard
│   │
│   └── verify-email/
│       └── page.tsx              YOUR JOB: Email verification page
│                                 - "Check your email" message
│                                 - V1: Can be a simple placeholder page
│
├── (dashboard)/                  ROUTE GROUP: Has sidebar + header
│   │
│   ├── layout.tsx                YOUR JOB: Dashboard shell
│   │                             - Check auth: if not logged in → redirect /login
│   │                             - Sidebar (left) with navigation links
│   │                             - Header (top) with user info + notification bell
│   │                             - Main content area (children render here)
│   │                             - Mobile: hamburger menu for sidebar
│   │
│   ├── merchant/                 MERCHANT-ONLY PAGES
│   │   │
│   │   ├── layout.tsx            YOUR JOB: Role guard
│   │   │                         - If user.role !== MERCHANT → redirect to /buyer/dashboard
│   │   │                         - This prevents buyers from accessing merchant pages
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx          YOUR JOB: Merchant home
│   │   │                         - Quick stats: total products, pending RFQs, active orders
│   │   │                         - Recent RFQs list
│   │   │                         - Recent orders list
│   │   │                         - "Add Product" quick action button
│   │   │
│   │   ├── onboarding/
│   │   │   └── page.tsx          YOUR JOB: Multi-step onboarding form
│   │   │                         - Step 1: Business info (address, CAC number)
│   │   │                         - Step 2: Bank details (bank code, account number, name)
│   │   │                         - Step 3: Review + submit
│   │   │                         - Progress indicator showing current step
│   │   │                         - Calls merchant.api.updateProfile() on each step
│   │   │
│   │   ├── products/
│   │   │   ├── page.tsx          YOUR JOB: Product list (own products)
│   │   │   │                     - Table/grid of merchant's products
│   │   │   │                     - Status badge (active/deleted)
│   │   │   │                     - "Add Product" button → links to /new
│   │   │   │                     - Edit, Delete, Restore actions per product
│   │   │   │                     - NO price column (products don't have prices)
│   │   │   │
│   │   │   ├── new/
│   │   │   │   └── page.tsx      YOUR JOB: Create product form
│   │   │   │                     - Fields: name, description, unit, categoryTag, minOrderQuantity
│   │   │   │                     - On submit → call product.api.createProduct()
│   │   │   │                     - On success → redirect to /merchant/products
│   │   │   │
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx  YOUR JOB: Edit product form
│   │   │                         - Pre-fill with existing product data
│   │   │                         - Same fields as create
│   │   │                         - On submit → call product.api.updateProduct()
│   │   │
│   │   ├── rfqs/
│   │   │   ├── page.tsx          YOUR JOB: Incoming RFQ inbox
│   │   │   │                     - List of RFQs from buyers
│   │   │   │                     - Show: buyer info, product name, quantity, status, date
│   │   │   │                     - Status badges (OPEN, QUOTED, ACCEPTED, etc.)
│   │   │   │                     - Click row → go to /merchant/rfqs/[id]
│   │   │   │
│   │   │   └── [id]/
│   │   │       └── page.tsx      YOUR JOB: RFQ detail + quote submission
│   │   │                         - Show RFQ details (product, quantity, delivery address, notes)
│   │   │                         - If status is OPEN: show quote form
│   │   │                           - Fields: unitPriceKobo, totalPriceKobo, deliveryFeeKobo, validUntil, notes
│   │   │                           - IMPORTANT: Input fields should accept Naira amounts
│   │   │                             and convert to kobo before sending to API
│   │   │                           - On submit → call quote.api.submitQuote()
│   │   │                         - If status is QUOTED: show submitted quote details
│   │   │
│   │   ├── orders/
│   │   │   ├── page.tsx          YOUR JOB: Merchant order list
│   │   │   │                     - Table of all orders
│   │   │   │                     - Columns: order ID, buyer, amount, status, date
│   │   │   │                     - Status badge with color coding
│   │   │   │                     - Click row → go to /merchant/orders/[id]
│   │   │   │
│   │   │   └── [id]/
│   │   │       └── page.tsx      YOUR JOB: Merchant order detail
│   │   │                         - Order summary card (amounts, buyer info)
│   │   │                         - Status timeline (from OrderEvents)
│   │   │                         - If status PAID: show "Dispatch" button
│   │   │                           - On click → call order.api.dispatchOrder()
│   │   │                           - After dispatch → show OTP to merchant
│   │   │                           - "Give this OTP to your delivery person: 482917"
│   │   │                         - If status DISPATCHED: show OTP reminder
│   │   │                         - If status COMPLETED: show payout info
│   │   │
│   │   └── inventory/
│   │       └── page.tsx          YOUR JOB: Stock levels
│   │                             - List of products with current stock count
│   │                             - "Adjust Stock" button per product
│   │                             - Modal/form for manual stock adjustment
│   │                               - Event type: STOCK_IN or ADJUSTMENT
│   │                               - Quantity, notes
│   │                             - Calls inventory.api.adjustStock()
│   │
│   └── buyer/                    BUYER-ONLY PAGES
│       │
│       ├── layout.tsx            YOUR JOB: Role guard
│       │                         - If user.role !== BUYER → redirect to /merchant/dashboard
│       │
│       ├── dashboard/
│       │   └── page.tsx          YOUR JOB: Buyer home
│       │                         - Active RFQs summary
│       │                         - Pending orders
│       │                         - "Browse Catalogue" quick action
│       │
│       ├── catalogue/
│       │   └── page.tsx          YOUR JOB: Product browsing
│       │                         - Grid of all active products from all merchants
│       │                         - Search bar (filters by product name or category)
│       │                         - Each card shows: name, unit, category, merchant name
│       │                         - NO PRICE shown (price comes via quote)
│       │                         - "Request Quote" button per product
│       │                           → navigates to /buyer/rfqs/new?productId=xxx
│       │
│       ├── rfqs/
│       │   ├── page.tsx          YOUR JOB: My RFQs list
│       │   │                     - List of buyer's own RFQs
│       │   │                     - Status badges
│       │   │                     - Click → go to /buyer/rfqs/[id]
│       │   │
│       │   ├── new/
│       │   │   └── page.tsx      YOUR JOB: Create RFQ form
│       │   │                     - Pre-select product if productId is in URL params
│       │   │                     - Fields: productId (dropdown/pre-selected), quantity,
│       │   │                       deliveryAddress, notes
│       │   │                     - On submit → call rfq.api.createRFQ()
│       │   │                     - On success → redirect to /buyer/rfqs
│       │   │
│       │   └── [id]/
│       │       └── page.tsx      YOUR JOB: RFQ detail with quote
│       │                         - Show RFQ details
│       │                         - If status QUOTED: show quote card
│       │                           - Display: unit price, total, delivery fee (formatted as Naira)
│       │                           - "Accept Quote" button → call quote.api.acceptQuote()
│       │                           - "Decline Quote" button → call quote.api.declineQuote()
│       │                         - If status ACCEPTED: show link to order
│       │
│       └── orders/
│           ├── page.tsx          YOUR JOB: Buyer order list
│           │                     - Same pattern as merchant orders
│           │
│           └── [id]/
│               └── page.tsx      YOUR JOB: Buyer order detail
│                                 - Order summary card
│                                 - Status timeline
│                                 - If PENDING_PAYMENT: show "Pay Now" button
│                                   → triggers Paystack popup (see Section 10)
│                                 - If DISPATCHED: show OTP input form
│                                   - 6-digit input
│                                   - On submit → call order.api.confirmDelivery(id, otp)
│                                 - If COMPLETED: show "Delivery confirmed" message
```

### Components

```
src/components/
│
├── ui/                           GENERIC UI PRIMITIVES (no business logic)
│   │
│   ├── button.tsx                YOUR JOB: Reusable button
│   │                             - Variants: primary, secondary, danger, ghost
│   │                             - States: loading (spinner), disabled
│   │                             - Sizes: sm, md, lg
│   │
│   ├── input.tsx                 YOUR JOB: Text input with label + error
│   │                             - Props: label, placeholder, error, type
│   │                             - Shows red border + error text when error prop set
│   │
│   ├── textarea.tsx              YOUR JOB: Multi-line text input
│   ├── select.tsx                YOUR JOB: Dropdown select
│   │
│   ├── badge.tsx                 YOUR JOB: Small colored label
│   │                             - Variants: success (green), warning (yellow), danger (red), info (blue), neutral (gray)
│   │
│   ├── card.tsx                  YOUR JOB: Container with border + shadow
│   │
│   ├── modal.tsx                 YOUR JOB: Overlay dialog
│   │                             - Props: isOpen, onClose, title, children
│   │                             - Close on ESC key + click outside
│   │
│   ├── toast.tsx                 YOUR JOB: Temporary notification popup
│   │                             - Types: success, error, warning, info
│   │                             - Auto-dismiss after 5 seconds
│   │
│   ├── skeleton.tsx              YOUR JOB: Loading placeholder
│   │                             - Animated gray rectangles
│   │                             - Used while data is loading
│   │
│   ├── empty-state.tsx           YOUR JOB: "Nothing here yet" display
│   │                             - Icon + message + action button
│   │                             - Used when lists are empty
│   │
│   ├── data-table.tsx            YOUR JOB: Reusable table with headers
│   ├── pagination.tsx            YOUR JOB: Page navigation (prev/next + page numbers)
│   │
│   └── status-badge.tsx          YOUR JOB: Status-aware colored badge
│                                 - Takes a status enum value
│                                 - Returns correct color per status:
│                                   PENDING_PAYMENT → yellow
│                                   PAID → blue
│                                   DISPATCHED → purple
│                                   DELIVERED → green
│                                   COMPLETED → green (darker)
│                                   CANCELLED → red
│                                   DISPUTE → red
│                                   OPEN → blue
│                                   QUOTED → yellow
│                                   ACCEPTED → green
│                                   DECLINED → red
│                                   EXPIRED → gray
│
├── layout/                       LAYOUT COMPONENTS
│   │
│   ├── sidebar.tsx               YOUR JOB: Left navigation
│   │                             - Shows different links based on user role:
│   │                               MERCHANT: Dashboard, Products, RFQs, Orders, Inventory
│   │                               BUYER: Dashboard, Catalogue, My RFQs, My Orders
│   │                             - Highlight active route
│   │                             - Logo at top
│   │                             - Logout button at bottom
│   │
│   ├── header.tsx                YOUR JOB: Top bar
│   │                             - User name + role display
│   │                             - Notification bell (with unread count badge)
│   │                             - Mobile: hamburger menu button
│   │
│   ├── mobile-nav.tsx            YOUR JOB: Slide-out menu for mobile
│   │                             - Same links as sidebar
│   │                             - Triggered by hamburger button in header
│   │
│   └── page-header.tsx           YOUR JOB: Page title bar
│                                 - Title text + optional action button
│                                 - Example: "Products" + "Add Product" button
│
├── auth/                         AUTH-SPECIFIC COMPONENTS
│   ├── login-form.tsx            YOUR JOB: Login form fields + submit logic
│   ├── register-form.tsx         YOUR JOB: Register form with role selection
│   └── role-select.tsx           YOUR JOB: Buyer vs Merchant toggle/cards
│
├── merchant/                     MERCHANT-SPECIFIC COMPONENTS
│   ├── onboarding-stepper.tsx    YOUR JOB: Multi-step wizard with progress bar
│   ├── product-form.tsx          YOUR JOB: Create/edit product form (shared)
│   ├── product-card.tsx          YOUR JOB: Product display in merchant list
│   ├── rfq-inbox-item.tsx        YOUR JOB: Single RFQ row in inbox
│   ├── quote-form.tsx            YOUR JOB: Form to submit a quote
│   │                             IMPORTANT: User types in Naira, you convert to kobo
│   ├── order-dispatch-action.tsx YOUR JOB: Dispatch button + OTP display after dispatch
│   └── stock-adjustment-form.tsx YOUR JOB: Modal form for stock adjustment
│
├── buyer/                        BUYER-SPECIFIC COMPONENTS
│   ├── catalogue-grid.tsx        YOUR JOB: Product grid layout with search
│   ├── catalogue-item.tsx        YOUR JOB: Single product card (NO price)
│   ├── rfq-form.tsx              YOUR JOB: Create RFQ form
│   ├── quote-review-card.tsx     YOUR JOB: Displays quote with accept/decline buttons
│   ├── payment-button.tsx        YOUR JOB: "Pay Now" button → opens Paystack popup
│   └── delivery-otp-input.tsx    YOUR JOB: 6-digit OTP input + submit
│
├── order/                        ORDER COMPONENTS (used by both roles)
│   ├── order-status-timeline.tsx YOUR JOB: Visual timeline from OrderEvents
│   │                             - Vertical list of status changes
│   │                             - Each step shows: status, timestamp, who triggered it
│   │                             - Current status highlighted
│   │                             - Completed steps have checkmarks
│   │
│   ├── order-summary-card.tsx    YOUR JOB: Order details card
│   │                             - Product name, quantity, unit price, delivery fee, total
│   │                             - All amounts displayed in Naira (converted from kobo)
│   │
│   └── order-list-item.tsx       YOUR JOB: Order row in list view
│
└── notification/                 NOTIFICATION COMPONENTS
    ├── notification-bell.tsx     YOUR JOB: Bell icon in header
    │                             - Shows red badge with unread count
    │                             - Polls every 60 seconds
    │                             - Click → opens dropdown
    │
    ├── notification-dropdown.tsx YOUR JOB: Dropdown list
    │                             - Shows most recent notifications
    │                             - Unread items highlighted
    │                             - Click item → mark as read + navigate to relevant page
    │
    └── notification-item.tsx     YOUR JOB: Single notification row
```

### Hooks, Providers, Library

```
src/hooks/
├── use-auth.ts                   YOUR JOB: Hook to access auth context
│                                 - Returns: user, isLoggedIn, login(), logout(), isLoading
│
├── use-current-user.ts           YOUR JOB: Returns current user + role
│                                 - Returns: user, role, merchantId (if merchant)
│
├── use-notifications.ts          YOUR JOB: Polls unread count every 60s
│                                 - Returns: unreadCount, notifications, markAsRead()
│                                 - Uses setInterval to poll /notifications/unread-count
│
└── use-debounce.ts               YOUR JOB: Debounces search input
                                  - Used in catalogue search bar
                                  - 300ms delay before triggering API call

src/providers/
├── auth-provider.tsx             YOUR JOB: Auth context provider
│                                 - Stores user + tokens in state
│                                 - Provides login(), logout(), refresh()
│                                 - On mount: check for existing token, validate it
│                                 - Auto-refresh access token before expiry
│
├── toast-provider.tsx            YOUR JOB: Toast notification context
│                                 - Provides showToast(type, message)
│                                 - Renders toast container at bottom of screen
│
└── query-provider.tsx            YOUR JOB: Optional data fetching provider
                                  - If using SWR or React Query, configure here
                                  - Otherwise can be skipped for V1

src/lib/
├── api-client.ts                 ALREADY EXISTS: Central HTTP client
│                                 - Adds Authorization header automatically
│                                 - Handles error responses
│                                 - YOU maintain this, but structure is already set
│
├── api/                          ALREADY EXISTS: 9 API module files
│   ├── auth.api.ts               - login(), register(), refresh(), logout()
│   ├── merchant.api.ts           - getProfile(), updateProfile()
│   ├── product.api.ts            - createProduct(), getCatalogue(), etc.
│   ├── rfq.api.ts                - createRFQ(), getMyRFQs(), etc.
│   ├── quote.api.ts              - submitQuote(), acceptQuote(), etc.
│   ├── order.api.ts              - getOrders(), dispatchOrder(), confirmDelivery(), etc.
│   ├── payment.api.ts            - initializePayment()
│   ├── inventory.api.ts          - getStock(), adjustStock()
│   └── notification.api.ts       - getNotifications(), markAsRead(), getUnreadCount()
│
├── paystack.ts                   YOUR JOB: Paystack inline popup helper
│                                 - Loads Paystack script dynamically
│                                 - Provides function to open payment popup
│
└── utils.ts                      YOUR JOB: Utility functions
                                  - cn() — merge Tailwind class names (use clsx + twMerge)
                                  - formatDate() — format timestamps for display
                                  - formatCurrency() — wraps koboToNaira from shared package

src/styles/
└── globals.css                   YOUR JOB: Tailwind directives + CSS variables
                                  - @tailwind base; @tailwind components; @tailwind utilities;
                                  - Custom colors, fonts if needed
```

---

## 5. How Frontend Talks to Backend

### The Rule

```
Component → API Layer (lib/api/*.api.ts) → API Client (lib/api-client.ts) → Backend
```

**NEVER do this:**
```typescript
// ❌ WRONG: Direct fetch in a component
const res = await fetch('http://localhost:4000/products');
```

**ALWAYS do this:**
```typescript
// ✅ RIGHT: Use the API layer
import { getCatalogue } from '@/lib/api/product.api';
const products = await getCatalogue();
```

### How the API Client Works

```
1. Component calls: product.api.getCatalogue()

2. getCatalogue() calls: apiClient.get('/products/catalogue')

3. apiClient.get() does:
   - Prepends base URL: http://localhost:4000/products/catalogue
   - Adds headers: { Authorization: 'Bearer <token>', Content-Type: 'application/json' }
   - Makes the fetch request
   - If response OK → returns parsed JSON
   - If response NOT OK → throws error with { error, code, statusCode }

4. Component receives the data or catches the error
```

### Request/Response Cycle Diagram

```
┌───────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  React        │     │  API Layer  │     │  API Client  │     │  Backend │
│  Component    │     │  (product.  │     │  (api-client │     │  (NestJS)│
│               │     │   api.ts)   │     │   .ts)       │     │          │
└───────┬───────┘     └──────┬──────┘     └──────┬───────┘     └────┬─────┘
        │                    │                    │                   │
        │  getCatalogue()    │                    │                   │
        ├───────────────────►│                    │                   │
        │                    │  get('/products/   │                   │
        │                    │  catalogue')       │                   │
        │                    ├───────────────────►│                   │
        │                    │                    │  GET /products/   │
        │                    │                    │  catalogue        │
        │                    │                    ├──────────────────►│
        │                    │                    │                   │
        │                    │                    │  { success: true, │
        │                    │                    │    data: [...] }  │
        │                    │                    │◄──────────────────┤
        │                    │   parsed response  │                   │
        │                    │◄───────────────────┤                   │
        │   Product[]        │                    │                   │
        │◄───────────────────┤                    │                   │
        │                    │                    │                   │
```

---

## 6. Authentication — How It Works In The Frontend

### Token Flow

```
1. User logs in → backend returns { accessToken, refreshToken }

2. Store access token in MEMORY (React state in AuthProvider)
   Store refresh token in MEMORY or httpOnly cookie
   NEVER store tokens in localStorage (security risk)

3. Every API request includes: Authorization: Bearer <accessToken>
   The apiClient.ts handles this automatically

4. Access token expires after 15 minutes
   → AuthProvider detects expiry (or gets 401 from API)
   → Automatically calls /auth/refresh with refresh token
   → Gets new access + refresh tokens
   → Retries the failed request

5. On logout:
   → Call /auth/logout (revokes refresh token on backend)
   → Clear tokens from memory
   → Redirect to /login
```

### Auth Provider Pattern

```typescript
// providers/auth-provider.tsx — simplified structure

interface AuthContextType {
  user: JwtPayload | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// On app mount:
// 1. Check if we have a stored refresh token
// 2. If yes → call /auth/refresh to get new access token
// 3. Decode the access token to get user info (sub, email, role, merchantId)
// 4. Set user in state

// On every API call:
// 1. apiClient reads access token from auth context
// 2. If 401 response → try refresh → retry request
// 3. If refresh also fails → logout + redirect to /login
```

### Route Protection

```typescript
// (dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  
  if (isLoading) return <Skeleton />;
  if (!isLoggedIn) redirect('/login');
  
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}

// (dashboard)/merchant/layout.tsx
export default function MerchantLayout({ children }) {
  const { user } = useCurrentUser();
  
  if (user?.role !== 'MERCHANT') redirect('/buyer/dashboard');
  
  return children;
}
```

---

## 7. The API Layer — Your Gateway to Backend

### How Each API File Works

Every file in `lib/api/` follows the same pattern:

```typescript
// lib/api/product.api.ts
import { apiClient } from '../api-client';
import type { ApiResponse, Product, CreateProductDto } from '@hardware-os/shared';

export async function createProduct(dto: CreateProductDto): Promise<ApiResponse<Product>> {
  return apiClient.post('/products', dto);
}

export async function getCatalogue(search?: string, page = 1, limit = 20): Promise<ApiResponse<Product[]>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  return apiClient.get(`/products/catalogue?${params}`);
}

export async function deleteProduct(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/products/${id}`);
}
```

### How To Use in a Component

```typescript
// In a page component
'use client';

import { useState, useEffect } from 'react';
import { getCatalogue } from '@/lib/api/product.api';
import type { Product } from '@hardware-os/shared';

export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCatalogue()
      .then(res => setProducts(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (error) return <ErrorState message={error} />;
  if (products.length === 0) return <EmptyState message="No products yet" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(p => <CatalogueItem key={p.id} product={p} />)}
    </div>
  );
}
```

---

## 8. Page-by-Page Build Guide

### Build Order (do these in this sequence)

```
WEEK 1:
Day 1-2: Layout shell + auth pages
  1. globals.css + tailwind config
  2. Root layout.tsx (providers)
  3. Auth layout (centered card)
  4. Login page + login-form component
  5. Register page + register-form + role-select
  6. Auth provider + use-auth hook

Day 3-4: Connect auth to backend + dashboard shell
  7. Wire login/register to API
  8. Dashboard layout (sidebar + header)
  9. Sidebar component (role-aware links)
  10. Header component (user info)
  11. Merchant role guard layout
  12. Buyer role guard layout

Day 5-6: Merchant pages + buyer catalogue
  13. Merchant onboarding page + stepper component
  14. Product form component (create/edit)
  15. Products list page (merchant view)
  16. Buyer catalogue page + catalogue-grid + catalogue-item
  17. Create RFQ page + form

Day 7-8: RFQ + Quote + Order pages
  18. Merchant RFQ inbox page + rfq-inbox-item
  19. Merchant RFQ detail + quote-form
  20. Buyer RFQ detail + quote-review-card
  21. Order list pages (merchant + buyer)
  22. Order detail page + order-status-timeline

WEEK 2:
Day 8-9: Payment + delivery
  23. Payment button component (Paystack inline)
  24. Buyer order detail with pay button
  25. Merchant order dispatch action + OTP display
  26. Buyer delivery OTP input

Day 9-10: Notifications + inventory
  27. Notification bell + dropdown + item components
  28. use-notifications hook (polling)
  29. Merchant inventory page + stock adjustment form

Day 11-14: Polish + integration
  30. Loading skeletons for every page
  31. Empty states for every list
  32. Error toasts for API failures
  33. Form validation messages
  34. Responsive design (mobile sidebar → hamburger)
  35. Confirmation modals (delete product, cancel order)
  36. Bug fixing + integration testing with backend
```

---

## 9. Component Library — What To Build

### Status Badge Color Map

This is critical. Use this exact mapping everywhere:

```typescript
// components/ui/status-badge.tsx
const STATUS_COLORS: Record<string, string> = {
  // Order statuses
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  DISPATCHED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-200 text-green-900',
  CANCELLED: 'bg-red-100 text-red-800',
  DISPUTE: 'bg-red-200 text-red-900',
  
  // RFQ statuses
  OPEN: 'bg-blue-100 text-blue-800',
  QUOTED: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  
  // Quote statuses
  PENDING: 'bg-yellow-100 text-yellow-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800',
  
  // Payment statuses
  INITIALIZED: 'bg-yellow-100 text-yellow-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
  
  // Verification statuses
  UNVERIFIED: 'bg-gray-100 text-gray-800',
  VERIFIED: 'bg-green-100 text-green-800',
};
```

---

## 10. Paystack Payment Integration

### How It Works (Step by Step)

```
1. Buyer is on order detail page, order status is PENDING_PAYMENT

2. Buyer clicks "Pay Now" button (payment-button.tsx)

3. Your component calls: payment.api.initializePayment({ orderId })

4. Backend returns: { data: { authorizationUrl, reference, accessCode } }

5. You open Paystack inline popup using the accessCode

6. Buyer enters card details on Paystack's secure form (NOT your form)

7. Paystack processes the payment

8. On success callback:
   - Show a "Payment processing..." message
   - DON'T update the order status yourself
   - The BACKEND handles status update via webhook
   - Poll the order detail every 3 seconds until status changes to PAID
   - Then show success toast + update the UI

9. On close callback (user closed popup without paying):
   - Show "Payment cancelled" message
   - Order stays in PENDING_PAYMENT
```

### Implementation

```typescript
// lib/paystack.ts
export function openPaystackPopup({
  publicKey,
  email,
  amountKobo,
  reference,
  onSuccess,
  onClose,
}: {
  publicKey: string;
  email: string;
  amountKobo: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}) {
  const handler = (window as any).PaystackPop.setup({
    key: publicKey,
    email,
    amount: amountKobo,
    ref: reference,
    callback: (response: { reference: string }) => {
      onSuccess(response.reference);
    },
    onClose,
  });
  handler.openIframe();
}
```

```typescript
// components/buyer/payment-button.tsx — simplified
export function PaymentButton({ order }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      // 1. Initialize payment via backend
      const res = await initializePayment({ orderId: order.id });
      
      // 2. Open Paystack popup
      openPaystackPopup({
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY!,
        email: user.email,
        amountKobo: Number(order.totalAmountKobo + order.deliveryFeeKobo),
        reference: res.data.paystackReference,
        onSuccess: (ref) => {
          // 3. Don't update status — backend does it via webhook
          // Just show "processing" and poll for status change
          showToast('info', 'Payment processing...');
          pollOrderStatus(order.id);
        },
        onClose: () => {
          showToast('warning', 'Payment cancelled');
          setLoading(false);
        },
      });
    } catch (err) {
      showToast('error', err.message);
      setLoading(false);
    }
  }

  return (
    <Button onClick={handlePay} loading={loading} disabled={loading}>
      Pay {formatKobo(order.totalAmountKobo + order.deliveryFeeKobo)}
    </Button>
  );
}
```

### Load Paystack Script

Add this to your root layout or the order detail page:

```html
<script src="https://js.paystack.co/v2/inline.js"></script>
```

Or load it dynamically in `paystack.ts` using a script loader.

**IMPORTANT:** Never handle card details yourself. Paystack's popup is PCI-compliant. You just open it and wait for callbacks.

---

## 11. Notification System (Frontend Side)

### How It Works

```
1. Header renders NotificationBell component
2. NotificationBell uses the useNotifications hook
3. useNotifications polls GET /notifications/unread-count every 60 seconds
4. Badge shows the unread count number
5. When user clicks bell → dropdown opens
6. Dropdown calls GET /notifications (first 10)
7. Clicking a notification → marks it as read + navigates to the relevant page:
   - NEW_RFQ → /merchant/rfqs/:id
   - QUOTE_RECEIVED → /buyer/rfqs/:id
   - PAYMENT_CONFIRMED → /merchant/orders/:id or /buyer/orders/:id
   - ORDER_DISPATCHED → /buyer/orders/:id
   - etc.
```

### Navigation Map for Notification Types

```typescript
function getNotificationLink(notification: Notification): string {
  const meta = notification.metadata;
  
  switch (notification.type) {
    case 'NEW_RFQ':           return `/merchant/rfqs/${meta?.rfqId}`;
    case 'QUOTE_RECEIVED':    return `/buyer/rfqs/${meta?.rfqId}`;
    case 'QUOTE_ACCEPTED':    return `/merchant/orders/${meta?.orderId}`;
    case 'QUOTE_DECLINED':    return `/merchant/rfqs/${meta?.rfqId}`;
    case 'RFQ_EXPIRED':       return `/buyer/rfqs/${meta?.rfqId}`;
    case 'PAYMENT_CONFIRMED': return `/${meta?.role}/orders/${meta?.orderId}`;
    case 'ORDER_CANCELLED':   return `/${meta?.role}/orders/${meta?.orderId}`;
    case 'ORDER_DISPATCHED':  return `/buyer/orders/${meta?.orderId}`;
    case 'DELIVERY_CONFIRMED':return `/merchant/orders/${meta?.orderId}`;
    case 'PAYOUT_INITIATED':  return `/merchant/orders/${meta?.orderId}`;
    default:                  return '/';
  }
}
```

---

## 12. State Management Approach

### V1 Strategy: Keep It Simple

```
Auth state          → React Context (AuthProvider)
Toast messages      → React Context (ToastProvider)
Page data           → useState + useEffect in each page (or SWR/React Query)
Form state          → useState in form components
Notification count  → useNotifications hook with polling
```

**NO global store.** No Redux, no Zustand. Every page fetches its own data. If a page needs to refresh after an action (like creating a product), just re-fetch.

---

## 13. Styling Rules & Design System

### Color Palette

```
Primary:     #1B2A4A (dark navy — headers, sidebar background)
Accent:      #2E75B6 (blue — links, active states, primary buttons)
Action:      #E87722 (orange — CTAs, important badges)
Success:     #16A34A (green)
Warning:     #EAB308 (yellow)
Danger:      #DC2626 (red)
Text:        #333333 (dark gray — body text)
Background:  #F9FAFB (light gray — page background)
Card BG:     #FFFFFF (white — card backgrounds)
Border:      #E5E7EB (light gray — borders)
```

### Layout Rules

```
Sidebar width:        256px (w-64)
Header height:        64px (h-16)
Page padding:         24px (p-6)
Card padding:         16px-24px (p-4 to p-6)
Card border radius:   8px (rounded-lg)
Card shadow:          shadow-sm
Max content width:    none (full width within main area)
Mobile breakpoint:    768px (md:)
```

### Typography

```
Page titles:     text-2xl font-bold text-gray-900
Section titles:  text-lg font-semibold text-gray-800
Body text:       text-sm text-gray-600
Table headers:   text-xs font-medium text-gray-500 uppercase
Form labels:     text-sm font-medium text-gray-700
Error text:      text-sm text-red-600
```

---

## 14. Backend API Response Format

Every API response from the backend follows this shape:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Success Response (Paginated)

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 47
  }
}
```

### Error Response

```json
{
  "error": "Quote has expired",
  "code": "QUOTE_EXPIRED",
  "statusCode": 400
}
```

### How To Handle in Components

```typescript
try {
  const res = await getCatalogue(search, page);
  setProducts(res.data);       // res.data is the array
  setTotal(res.meta?.total);   // pagination info
} catch (err: any) {
  showToast('error', err.message);  // "Quote has expired"
  // err.statusCode — 400, 401, 404, etc.
  // err.code — "QUOTE_EXPIRED", "NOT_FOUND", etc.
}
```

---

## 15. Every API Endpoint You'll Call

### Auth (no login required)

| What You Need | Function | Backend Endpoint |
|--------------|----------|-----------------|
| Register | `auth.api.register(dto)` | POST /auth/register |
| Login | `auth.api.login(dto)` | POST /auth/login |
| Refresh token | `auth.api.refresh(token)` | POST /auth/refresh |
| Logout | `auth.api.logout()` | POST /auth/logout |

### Merchant Pages

| What You Need | Function | Backend Endpoint |
|--------------|----------|-----------------|
| Get own profile | `merchant.api.getProfile()` | GET /merchants/me |
| Update profile | `merchant.api.updateProfile(dto)` | PATCH /merchants/me |
| Create product | `product.api.createProduct(dto)` | POST /products |
| List own products | `product.api.getMyProducts()` | GET /products |
| Update product | `product.api.updateProduct(id, dto)` | PATCH /products/:id |
| Delete product | `product.api.deleteProduct(id)` | DELETE /products/:id |
| Restore product | `product.api.restoreProduct(id)` | POST /products/:id/restore |
| List incoming RFQs | `rfq.api.getMerchantRFQs()` | GET /rfqs/merchant |
| Get RFQ detail | `rfq.api.getRFQ(id)` | GET /rfqs/:id |
| Submit quote | `quote.api.submitQuote(dto)` | POST /quotes |
| List orders | `order.api.getOrders()` | GET /orders |
| Get order detail | `order.api.getOrder(id)` | GET /orders/:id |
| Dispatch order | `order.api.dispatchOrder(id)` | POST /orders/:id/dispatch |
| Get stock level | `inventory.api.getStock(productId)` | GET /inventory/:productId |
| Adjust stock | `inventory.api.adjustStock(dto)` | POST /inventory/adjust |

### Buyer Pages

| What You Need | Function | Backend Endpoint |
|--------------|----------|-----------------|
| Browse catalogue | `product.api.getCatalogue(search)` | GET /products/catalogue |
| Get product detail | `product.api.getProduct(id)` | GET /products/:id |
| Create RFQ | `rfq.api.createRFQ(dto)` | POST /rfqs |
| List my RFQs | `rfq.api.getMyRFQs()` | GET /rfqs |
| Get RFQ detail | `rfq.api.getRFQ(id)` | GET /rfqs/:id |
| Cancel RFQ | `rfq.api.cancelRFQ(id)` | POST /rfqs/:id/cancel |
| Get quote for RFQ | `quote.api.getQuotesByRFQ(rfqId)` | GET /quotes/rfq/:rfqId |
| Accept quote | `quote.api.acceptQuote(id)` | POST /quotes/:id/accept |
| Decline quote | `quote.api.declineQuote(id)` | POST /quotes/:id/decline |
| List my orders | `order.api.getOrders()` | GET /orders |
| Get order detail | `order.api.getOrder(id)` | GET /orders/:id |
| Initialize payment | `payment.api.initializePayment(dto)` | POST /payments/initialize |
| Confirm delivery | `order.api.confirmDelivery(id, otp)` | POST /orders/:id/confirm-delivery |

### Both Roles

| What You Need | Function | Backend Endpoint |
|--------------|----------|-----------------|
| Get notifications | `notification.api.getNotifications()` | GET /notifications |
| Mark as read | `notification.api.markAsRead(id)` | PATCH /notifications/:id/read |
| Get unread count | `notification.api.getUnreadCount()` | GET /notifications/unread-count |

---

## 16. Data Types & Enums You'll Use

Import everything from `@hardware-os/shared`:

```typescript
import { 
  UserRole,
  OrderStatus, 
  RFQStatus, 
  QuoteStatus,
  PaymentStatus,
  VerificationStatus,
  NotificationType,
} from '@hardware-os/shared';

import type {
  Product,
  RFQ,
  Quote,
  Order,
  OrderEvent,
  Payment,
  Notification,
  MerchantProfile,
  ApiResponse,
  PaginatedResponse,
} from '@hardware-os/shared';
```

### Key Type Shapes

```typescript
// What a product looks like (from GET /products/catalogue)
interface Product {
  id: string;           // UUID
  merchantId: string;
  name: string;         // "Dangote Cement 42.5kg"
  description?: string;
  unit: string;         // "bag", "piece", "ton"
  categoryTag: string;  // "cement", "rods", "plumbing"
  minOrderQuantity: number;
  isActive: boolean;
  createdAt: string;    // ISO date string
  // NOTE: NO price field. This is correct.
}

// What a quote looks like (from GET /quotes/rfq/:rfqId)
interface Quote {
  id: string;
  rfqId: string;
  merchantId: string;
  unitPriceKobo: bigint;     // Display as Naira: ₦6,500.00
  totalPriceKobo: bigint;    // Display as Naira: ₦325,000.00
  deliveryFeeKobo: bigint;   // Display as Naira: ₦5,000.00
  currency: string;          // "NGN"
  validUntil: string;        // ISO date
  status: QuoteStatus;
}

// What an order looks like (from GET /orders/:id)
interface Order {
  id: string;
  quoteId: string;
  buyerId: string;
  merchantId: string;
  totalAmountKobo: bigint;   // Display as Naira
  deliveryFeeKobo: bigint;
  currency: string;
  status: OrderStatus;
  deliveryOtp?: string;      // Only visible to merchant after dispatch
  idempotencyKey: string;
  createdAt: string;
  events?: OrderEvent[];     // Timeline data
}
```

---

## 17. Money Display Rules

**CRITICAL: All money from the API is in kobo (integer). You must convert to Naira for display.**

```typescript
import { koboToNaira, formatKobo } from '@hardware-os/shared';

// kobo → display
formatKobo(650000n)     // "₦6,500.00"
formatKobo(32500000n)   // "₦325,000.00"
formatKobo(500000n)     // "₦5,000.00"
formatKobo(0n)          // "₦0.00"
```

### User Input → Kobo (for sending to API)

When merchant types a price in the quote form, they type in Naira. You convert to kobo before sending:

```typescript
import { nairaToKobo } from '@hardware-os/shared';

// User types: 6500 (meaning ₦6,500)
const koboValue = nairaToKobo(6500);  // 650000n

// Send to API
submitQuote({ 
  rfqId, 
  unitPriceKobo: Number(koboValue),  // API might expect number, not bigint
  totalPriceKobo: Number(koboValue * BigInt(quantity)),
  deliveryFeeKobo: Number(nairaToKobo(deliveryFeeInput)),
  validUntil,
});
```

### Display Rules

- Always show the ₦ symbol
- Always show 2 decimal places
- Use comma for thousands separator
- Never show "kobo" to the user — always show "Naira"
- Never show raw kobo values in the UI

---

## 18. Error Handling in the Frontend

### Three Levels of Error Handling

**Level 1: Page-level loading/error states**
```typescript
if (loading) return <Skeleton />;          // Loading skeleton
if (error) return <ErrorState msg={error} retry={refetch} />;  // Error with retry
if (data.length === 0) return <EmptyState />;  // Empty list
```

**Level 2: Form submission errors**
```typescript
try {
  await createProduct(formData);
  showToast('success', 'Product created!');
  router.push('/merchant/products');
} catch (err: any) {
  if (err.statusCode === 400) {
    // Validation error — show on form
    setFormErrors(err.details);
  } else {
    // Other error — show toast
    showToast('error', err.message);
  }
}
```

**Level 3: Global error handling**
```typescript
// In api-client.ts — already handles most errors
// 401 → auto-refresh token or redirect to login
// 403 → show "Access denied" toast
// 500 → show "Something went wrong" toast
```

### Error States Every Page Must Have

| State | What To Show |
|-------|-------------|
| Loading | Skeleton placeholder (animated gray shapes matching the layout) |
| Empty | Icon + "No [items] yet" message + action button (e.g., "Create your first product") |
| Error | Error message + "Try again" button that re-fetches |
| 404 | "Not found" when navigating to a specific item that doesn't exist |
| Unauthorized | Auto-redirect to /login (handled by auth provider) |

---

## 19. Things That Will Break The Workflow (DON'T DO These)

### 1. DON'T update order status from the frontend

```
❌ WRONG: After Paystack success → setOrderStatus('PAID')
✅ RIGHT: After Paystack success → poll GET /orders/:id until status changes
```

The backend updates order status via webhook. If you update it in the frontend before the webhook processes, the UI will show PAID but the backend still says PENDING_PAYMENT.

### 2. DON'T show prices on product cards

```
❌ WRONG: <p>Price: ₦6,500</p> on catalogue items
✅ RIGHT: No price shown. Show "Request Quote" button instead.
```

Products don't have prices. This is a business requirement, not a missing feature.

### 3. DON'T send money as Naira to the API

```
❌ WRONG: { unitPriceKobo: 6500 }     ← This is ₦65.00, not ₦6,500
✅ RIGHT: { unitPriceKobo: 650000 }    ← This is ₦6,500.00
```

Always multiply by 100 (or use nairaToKobo utility).

### 4. DON'T make direct fetch() calls in components

```
❌ WRONG: const res = await fetch('/api/products')
✅ RIGHT: const res = await product.api.getCatalogue()
```

The API layer handles auth headers, error formatting, and base URL.

### 5. DON'T store tokens in localStorage

```
❌ WRONG: localStorage.setItem('token', accessToken)
✅ RIGHT: Store in React state (memory) via AuthProvider
```

localStorage is accessible to any JavaScript on the page, including XSS attacks.

### 6. DON'T call backend endpoints that don't exist

Only use endpoints listed in Section 15 of this document. If you need data that isn't available, ask the backend team — don't invent your own endpoint.

### 7. DON'T show the delivery OTP to the buyer

```
❌ WRONG: Showing OTP in buyer's order detail page
✅ RIGHT: OTP is only visible on the merchant's order detail page
```

The merchant gives the OTP to the delivery person, who tells the buyer in person. The buyer then enters it in the app to confirm delivery.

### 8. DON'T skip form validation

Validate on the frontend AND rely on backend validation. If the user types an invalid email, catch it before sending. But backend will also validate, so handle 400 errors too.

### 9. DON'T forget responsive design

Many Lagos merchants use phones. The dashboard MUST work on mobile screens. Sidebar becomes a hamburger menu. Tables become card lists. Forms are single-column.

### 10. DON'T add features that aren't in V1

No search filters beyond basic text search. No image upload. No real-time chat. No dark mode. No animations. Keep it functional and clean.

---

## 20. Your Sprint Timeline Day-by-Day

| Day | What To Build | Integration With |
|-----|--------------|-----------------|
| **D1** | Next.js scaffold, Tailwind config, globals.css, root layout, auth layout | None (solo work) |
| **D2** | Login page, register page, login-form, register-form, role-select, auth-provider, use-auth hook | None (can use mock auth until backend ready) |
| **D3** | Wire auth to real backend API, token handling, redirect logic | **Dev A** (auth API must work) |
| **D4** | Dashboard layout, sidebar, header, mobile-nav, page-header. Merchant + buyer role guard layouts | **IC-2 checkpoint** |
| **D5** | Merchant onboarding page + stepper. Product form component (create/edit). Products list page. | **Dev B** (merchant + product API must work) |
| **D6** | Buyer catalogue page + catalogue-grid + catalogue-item. RFQ creation page + rfq-form. | **IC-3 checkpoint** |
| **D7** | Merchant RFQ inbox + rfq-inbox-item. Merchant RFQ detail + quote-form. | **Dev B** (RFQ + quote API must work) |
| **D8** | Buyer RFQ detail + quote-review-card. Paystack integration + payment-button. Order detail + timeline. | **IC-4 checkpoint** |
| **D9** | Merchant order management: dispatch action + OTP display. Buyer delivery OTP input. | **Dev A** (order + payment API must work) |
| **D10** | Notification bell, dropdown, item components. use-notifications hook. Merchant inventory page. | **IC-5 checkpoint** |
| **D11** | All loading skeletons. All empty states. Error toasts. Form validation messages. | Solo work (polish) |
| **D12** | Responsive design pass: mobile sidebar → hamburger, table → cards. Confirmation modals. | **IC-6 checkpoint** |
| **D13** | Deploy to Vercel. Configure env vars. Test full flow on staging URL. | All devs |
| **D14** | Bug bash. Record demo video. Final fixes. | **IC-7 checkpoint** |

---

## 21. Integration Checkpoints With Backend Team

These are the days when YOU and the backend team must verify things work together:

| Checkpoint | Day | What YOU Test |
|-----------|-----|-------------|
| **IC-2** | Day 4 | Register on your UI → JWT returned → protected dashboard loads. Login works. Logout works. |
| **IC-3** | Day 6 | Merchant creates product via your form → appears in buyer catalogue. Data is scoped correctly. |
| **IC-4** | Day 8 | Full happy path: RFQ → Quote → Accept → Pay via Paystack (test mode) → Order status updates. |
| **IC-5** | Day 10 | Notifications appear after actions. Inventory page shows stock. OTP flow works. |
| **IC-6** | Day 12 | Error cases: expired quote acceptance fails gracefully. Double-click doesn't crash. Mobile works. |
| **IC-7** | Day 14 | Everything works on staging URL. No console errors. No broken pages. |

### What To Do If Backend Isn't Ready

Days 1-4: You can build WITHOUT the backend by using mock data:

```typescript
// Temporary mock — remove when backend is ready
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Dangote Cement', unit: 'bag', categoryTag: 'cement', ... },
  { id: '2', name: 'Iron Rod 12mm', unit: 'length', categoryTag: 'rods', ... },
];
```

By Day 5, Dev B should have merchant/product APIs ready. By Day 7, RFQ/quote APIs. By Day 8, Dev A should have payment working.

If an API is still not ready when you need it, tell the team immediately. Dev B can create a stub endpoint that returns hardcoded data so you're not blocked.

---

## 22. Local Development Setup

```bash
# 1. Make sure Docker is running (Postgres + Redis)
docker-compose up -d

# 2. Start backend (terminal 1)
pnpm --filter @hardware-os/backend dev
# Runs on http://localhost:4000

# 3. Start frontend (terminal 2)
pnpm --filter @hardware-os/web dev
# Runs on http://localhost:3000

# 4. Open in browser
open http://localhost:3000
```

### Environment Variables You Need

Create `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PAYSTACK_KEY=pk_test_xxxxx
```

### Testing Paystack

1. Get test keys from https://dashboard.paystack.com (Settings → API Keys)
2. Use Paystack's test card: 4084 0840 8408 4081 (any future expiry, any CVV)
3. For OTP: use 123456

### Useful Browser DevTools Checks

- **Network tab:** Verify all API calls go to localhost:4000
- **Console:** No errors should appear during normal use
- **Application tab:** Verify NO tokens in localStorage (they should be in memory only)
- **Responsive mode:** Test at 375px (mobile), 768px (tablet), 1024px+ (desktop)

---

**This document is your single source of truth for frontend development. Build every page listed here, connect every API listed here, follow every rule listed here. If something isn't in this doc, it's not in V1.**
