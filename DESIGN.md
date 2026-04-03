# twizrr Design System v2.1

> **Last updated:** March 2026
> **Replaces:** V1 B2B Industrial Design System and v2.0 amber palette (both DEPRECATED)
> **Purpose:** Technical blueprint for implementing twizrr's social commerce UI across web and mobile. Single source of truth for all design decisions.

---

## 1. Core Philosophy

**Mission:** Make buying and selling on WhatsApp feel safe, social, and effortless.

**Design Personality:**
- **Warm, not corporate.** twizrr is a marketplace for real people, not an enterprise dashboard. The UI should feel like browsing Instagram, not filing a report.
- **Trustworthy, not flashy.** Every pixel should communicate safety — escrow protection, verified merchants, secure payments. Trust is built through clarity, not decoration.
- **Social-first.** Products are "posts." Merchants are "profiles you follow." The feed is the front door. Commerce happens inside conversations.
- **WhatsApp-native thinking.** Even on the web, design as if the buyer might switch to WhatsApp at any moment. Keep flows short, actions clear, and always offer the WhatsApp bridge.

**Anti-patterns (never do these):**
- No enterprise dashboard aesthetics (dense tables, KPI grids, kanban boards on buyer-facing pages)
- No industrial or construction visual language
- No hidden prices — prices are always visible on product cards
- No "Request Quote" CTAs — this is direct commerce with Buy Now and Add to Cart
- No glassmorphism, no heavy gradients, no neon effects
- No dark patterns (fake urgency, hidden fees, confusing checkout)

---

## 2. Color Palette

### Brand Colors

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| `brand-primary` | `#00C853` | `hsl(145, 100%, 39%)` | Primary accent — CTAs, active states, highlights, brand identity |
| `brand-primary-hover` | `#00A846` | `hsl(145, 100%, 33%)` | Hover state for primary buttons and links |
| `brand-primary-light` | `#E8F5E9` | `hsl(120, 38%, 94%)` | Subtle backgrounds for highlighted sections, success states |
| `brand-primary-dark` | `#4ADE80` | `hsl(142, 69%, 58%)` | Dark mode primary — brighter for visibility on dark backgrounds |
| `brand-secondary` | `#0F2A4A` | `hsl(213, 67%, 18%)` | Deep blue — headings, sidebar background, premium feel |
| `brand-accent` | `#D97706` | `hsl(25, 79%, 52%)` | Accent orange — ratings, stars, badges, attention items |

### Backgrounds

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `bg-primary` | `#FFFFFF` | `#0F1117` | Main page background |
| `bg-secondary` | `#F9FAFB` | `#1A1D27` | Card backgrounds, sidebar, sections |
| `bg-tertiary` | `#F3F4F6` | `#242836` | Input fields, hover states, category pills |
| `bg-elevated` | `#FFFFFF` | `#1E2230` | Elevated cards, modals, dropdowns |

### Text

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `text-primary` | `#111827` | `#F1F2F4` | Headings, product names, prices |
| `text-secondary` | `#4B5563` | `#9CA3AF` | Descriptions, metadata, timestamps |
| `text-tertiary` | `#9CA3AF` | `#6B7280` | Placeholders, hints, disabled text |
| `text-on-brand` | `#FFFFFF` | `#FFFFFF` | Text on brand-colored buttons |

### Status Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `status-success` | `#059669` | `#34D399` | Paid, delivered, verified, in stock |
| `status-warning` | `#D97706` | `#FBBF24` | Pending, dispatched, low stock |
| `status-error` | `#DC2626` | `#F87171` | Failed, cancelled, out of stock, dispute |
| `status-info` | `#2563EB` | `#60A5FA` | In transit, processing, informational |

### Verification Badge Colors

| Tier | Color | Icon |
|------|-------|------|
| Tier 1 — Basic | `#9CA3AF` (Gray) | Single checkmark |
| Tier 2 — Identity | `#059669` (Green) | Double checkmarks |
| Tier 3 — Business | `#2563EB` (Blue) | Blue tick |

### Borders

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `border-default` | `#E5E7EB` | `#2D3348` | Card borders, dividers |
| `border-hover` | `#D1D5DB` | `#404860` | Hover state borders |
| `border-focus` | `#00C853` | `#4ADE80` | Focus rings on inputs and interactive elements |

### Star Ratings
- Always use `brand-accent` (#D97706 orange) for filled stars
- Empty stars use `border-default` color
- Never use green for stars — green is for CTAs and verification only

---

## 3. Typography

**Primary font:** Inter
**Monospace font:** JetBrains Mono or Roboto Mono (prices, product codes, OTP inputs)

Remove from codebase: Outfit, DM Sans, Caveat. Consolidate to Inter only (with system sans-serif fallback: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto).

### Scale

| Role | Desktop | Mobile | Weight | Line Height | Usage |
|------|---------|--------|--------|-------------|-------|
| Page title | 28px | 22px | 700 | 1.2 | "Explore Products", "My Orders" |
| Section header | 20px | 18px | 600 | 1.3 | "Top Merchants This Week", card section titles |
| Product name | 16px | 15px | 600 | 1.4 | Product card titles, merchant names |
| Body | 15px | 14px | 400 | 1.5 | Descriptions, details, chat text |
| Caption | 13px | 12px | 400 | 1.4 | Timestamps, metadata, "2h ago", "per bag" |
| Price | 18px | 16px | 700 | 1.0 | Naira amounts — always use monospace font |
| Button | 15px | 14px | 600 | 1.0 | CTA labels |
| Badge | 11px | 11px | 600 | 1.0 | Status pills, verification badges |

### Price Display Rules
- Always use monospace font for prices
- Always prefix with Naira sign: ₦
- Always format with commas: ₦185,000 not ₦185000
- Never show kobo to buyers unless the price has actual kobo values
- "per unit" labels use caption size in text-secondary color

---

## 4. Spacing & Layout

### Spacing Scale (4px grid)

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Tight gaps (icon-to-text, badge padding) |
| `space-sm` | 8px | Inner card padding, between inline elements |
| `space-md` | 12px | Between card sections, form field gaps |
| `space-lg` | 16px | Card padding, section spacing |
| `space-xl` | 24px | Between sections, page margins |
| `space-2xl` | 32px | Major section breaks |
| `space-3xl` | 48px | Page-level top/bottom padding |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Buttons, badges, pills |
| `radius-md` | 10px | Input fields, small cards |
| `radius-lg` | 14px | Product cards, modal corners |
| `radius-xl` | 20px | Large cards, image containers |
| `radius-full` | 9999px | Avatars, circular buttons, category pills |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.08)` | Product cards, merchant cards |
| `shadow-elevated` | `0 4px 12px rgba(0,0,0,0.1)` | Modals, dropdowns, floating elements |
| `shadow-none` | `none` | Dark mode cards (use border instead) |

**Dark mode rule:** Replace shadows with 1px solid borders using `border-default`. Shadows are invisible on dark backgrounds.

---

## 5. Component Specifications

### Product Feed Card

```
┌─────────────────────────────────────────┐
│  [Avatar] Merchant Name ✓   Follow      │  ← Merchant header (avatar 32px, name 14px semibold)
│  2h ago                                 │  ← Timestamp (caption, text-secondary)
├─────────────────────────────────────────┤
│                                         │
│           [Product Image]               │  ← 1:1 aspect ratio, radius-xl, Cloudinary w_400
│           (tap to view detail)          │
│                                         │
├─────────────────────────────────────────┤
│  Product Name                    ★ 4.8  │  ← Name 16px semibold, rating with orange star
│  Description preview text that          │  ← Body text, max 2 lines, text-secondary
│  truncates after two lines...           │
│                                         │
│  ₦185,000          🛒  🔖  [Quick Buy] │  ← Price (monospace 18px bold), actions row
│  In stock                               │  ← Caption, status-success color
└─────────────────────────────────────────┘
```

**Card specs:**
- Width: fill container (responsive grid: 1 col mobile, 2 col tablet, 3 col desktop)
- Padding: `space-lg` (16px)
- Border: 1px solid `border-default`
- Border radius: `radius-lg` (14px)
- Background: `bg-elevated`
- Shadow: `shadow-card` in light mode, border only in dark mode
- Image: 1:1 aspect ratio, `radius-xl` corners, Cloudinary `q_auto,f_auto,w_400`
- Quick Buy button: `brand-primary` green background, white text, `radius-sm`
- Follow link: `brand-primary` green text
- Star rating: `brand-accent` orange
- Cart and bookmark icons: `text-secondary`, `text-primary` on hover
- **ProductCard must NOT show wholesale prices** — remove all wholesale/retail price logic

### Merchant Profile Card (Top Merchants row)

- Horizontal scroll on mobile
- Avatar: 48px circle with 2px `brand-primary` green border for verified
- Background: `bg-secondary`
- Border radius: `radius-full` on container (pill shape)
- Padding: `space-sm` vertical, `space-lg` horizontal
- Star rating: `brand-accent` orange

### Category Pill Bar

- Horizontal scroll, no wrapping
- Active pill: `brand-primary` green background, `text-on-brand` white text
- Inactive pill: `bg-tertiary` background, `text-secondary` text
- Icon above text (24px icon, 12px label)
- Border radius: `radius-full`
- Gap between pills: `space-sm`

### Categories (official list only)

1. Electronics
2. Fashion
3. Home & Kitchen
4. Health & Beauty
5. Food & Groceries
6. Phones & Gadgets
7. Sports & Fitness
8. Baby & Kids
9. Other

**Never include:** Building, Building Materials, Hardware, Auto Parts, Vehicles, Wholesale

### Search Bar

- Full width minus sidebar
- Height: 44px (minimum touch target)
- Border radius: `radius-full`
- Background: `bg-tertiary`
- Camera icon on right for image search
- Focus state: `border-focus` green ring

### Quick Buy Button
- Background: `brand-primary` green (#00C853)
- Text: `text-on-brand` white, 15px semibold
- Border radius: `radius-sm` (6px)
- Padding: 8px 16px
- Hover: `brand-primary-hover` (#00A846)
- Min height: 36px

### OTP Input (Delivery Confirmation)

- 6 separate input boxes
- Each box: 48px × 48px, `radius-md`, 2px border
- Font: monospace, 24px, bold
- Active box: `border-focus` green
- Auto-advance on digit entry
- Paste support for full 6-digit code

### Verification Badge
- Inline after merchant name, never standalone
- Tier 1: gray checkmark (16px)
- Tier 2: double green checkmark (16px)
- Tier 3: blue tick (16px)
- Always icon, never text label

---

## 6. Navigation

### Buyer Sidebar (Desktop — 240px fixed left)

| Section | Label | Icon | Route |
|---------|-------|------|-------|
| Browse | Catalogue | grid_view | /buyer/catalogue |
| Browse | Merchants | storefront | /buyer/merchants |
| Shopping | My Cart | shopping_cart | /buyer/cart |
| Shopping | Active Orders | local_shipping | /buyer/orders |
| Shopping | Saved Items | bookmark | /buyer/saved |
| Account | Notifications | notifications | /buyer/notifications |
| Account | Profile Settings | settings | /buyer/profile |
| — | Continue on WhatsApp | WhatsApp icon | Opens WhatsApp bot link |

### Buyer Mobile Navigation (Bottom bar — 5 items)

| Label | Icon | Route |
|-------|------|-------|
| Home | home | /buyer/catalogue |
| Search | search | /buyer/search |
| Cart | shopping_cart | /buyer/cart |
| Orders | receipt_long | /buyer/orders |
| Profile | person | /buyer/profile |

### Merchant Sidebar (Desktop — 240px fixed left)

| Section | Label | Icon | Route |
|---------|-------|------|-------|
| Store | Dashboard | dashboard | /merchant/dashboard |
| Store | Products | inventory | /merchant/products |
| Store | Orders | shopping_bag | /merchant/orders |
| Finance | Payouts | account_balance | /merchant/payouts |
| Finance | Analytics | bar_chart | /merchant/analytics |
| Account | Store Settings | settings | /merchant/settings |
| Account | Verification | verified | /merchant/verification |
| — | Switch to Buyer | swap_horiz | /buyer/catalogue |

**Never include in any sidebar:** Wholesale, Supplies Cart, Procurement, RFQ, Quotes, Trade Financing, Supplier anything

---

## 7. Public Page URL Structure

| Page | URL Pattern | Example |
|------|------------|---------|
| Merchant store | `/@:slug` | twizrr.com/@fashionhub |
| Product detail | `/p/:productCode` | twizrr.com/p/NK-AF1-07 |
| Category browse | `/c/:categorySlug` | twizrr.com/c/electronics |
| Home / Feed | `/` | twizrr.com |

Authenticated dashboard pages keep standard routes: `/buyer/*`, `/merchant/*`, `/admin/*`

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | 0 — 639px | Single column, bottom nav, no sidebar |
| Tablet | 640 — 1023px | Two column feed, collapsible sidebar |
| Desktop | 1024px+ | Three column feed, fixed sidebar |

### Mobile-Specific Rules
- Minimum touch target: 44px × 44px
- Input font size: minimum 16px (prevents iOS auto-zoom)
- Sidebar collapses to hamburger menu
- Bottom navigation bar: 56px height, fixed position
- Product feed: single column, full-width cards
- No hover states — use active/pressed states instead

---

## 9. Image Specifications

| Context | Dimensions | Cloudinary Transform | Aspect Ratio |
|---------|-----------|---------------------|-------------|
| Profile avatar | 200 × 200 | `w_200,h_200,c_fill,g_face,q_auto,f_auto` | 1:1 circle |
| Merchant banner | 1200 × 400 | `w_1200,h_400,c_fill,q_auto,f_auto` | 3:1 |
| Product feed thumbnail | 400 × 400 | `w_400,h_400,c_fill,q_auto,f_auto` | 1:1 |
| Product detail image | 800px wide | `w_800,q_auto,f_auto` | Original ratio |
| Category icon | 100 × 100 | `w_100,h_100,c_fill,q_auto,f_auto` | 1:1 |

---

## 10. Dark Mode Rules

- Use CSS variables / Tailwind `dark:` classes for all colors
- Never hardcode hex colors in components
- Replace shadows with borders in dark mode
- Toggle via `next-themes` with `class` strategy
- User preference persisted in localStorage

| Element | Light | Dark |
|---------|-------|------|
| Page background | `#FFFFFF` | `#0F1117` |
| Card background | `#FFFFFF` | `#1E2230` |
| Card border | `#E5E7EB` | `#2D3348` |
| Primary text | `#111827` | `#F1F2F4` |
| Secondary text | `#4B5563` | `#9CA3AF` |
| Brand primary | `#00C853` | `#4ADE80` |
| Brand accent (stars) | `#D97706` | `#FBBF24` |
| Input background | `#F3F4F6` | `#242836` |

---

## 11. Escrow Trust Indicators

### On product cards:
- Verification badge next to merchant name
- "Escrow Protected" small shield icon near Buy button

### On checkout:
- "Your money is protected. Payment is held securely until you confirm delivery."
- Shield icon + green accent color
- Visual flow: Pay → Held Safely → Confirm Delivery → Merchant Paid

### On order tracking:
- "Payment held securely" (after payment, before dispatch)
- "Delivery in progress — confirm when received" (after dispatch)
- "Completed — merchant has been paid" (after confirmation)
- OTP input prominent when status is DISPATCHED

### On merchant store page:
- Verification tier badge prominently displayed
- Star rating + total completed orders + member since date

---

## 12. WhatsApp Bridge

### Touchpoints:
- Floating WhatsApp button on bottom-right of all buyer pages
- "Continue on WhatsApp" option in checkout flow
- Product code copy with toast: "Product code copied — paste in WhatsApp to buy"
- "Share to WhatsApp" in product share options

### WhatsApp button spec:
- Size: 56px circle
- Color: `#25D366` (official WhatsApp green)
- Icon: WhatsApp logo (white)
- Shadow: `shadow-elevated`
- Position: fixed, bottom-right, 24px from edges
- Mobile: 16px above bottom navigation bar

---

## 13. Tailwind Configuration

Update `tailwind.config.ts` to match this design system:

```typescript
// Colors to add/update in tailwind.config.ts
colors: {
  brand: {
    primary: '#00C853',
    'primary-hover': '#00A846',
    'primary-light': '#E8F5E9',
    'primary-dark': '#4ADE80',
    secondary: '#0F2A4A',
    accent: '#D97706',
  },
  // Remove: any amber/gold primary colors
  // Remove: any twizrr Green that doesn't match #00C853
}

// Fonts to update
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
  // Remove: Outfit, DM Sans, Caveat
}
```

---

## 14. Animation & Transitions

| Interaction | Duration | Easing | Property |
|------------|----------|--------|----------|
| Button hover/press | 150ms | ease-out | background-color, transform (scale 0.98) |
| Card hover | 200ms | ease-out | border-color, shadow |
| Page transition | 200ms | ease-in-out | opacity |
| Modal open | 250ms | ease-out | opacity, transform (translateY) |
| Toast notification | 300ms in, 200ms out | ease-out | opacity, transform |
| Skeleton loading | 1.5s loop | ease-in-out | opacity (pulse) |

### Loading states:
- Use skeleton screens, never spinners
- Skeleton: `bg-tertiary` pulsing rectangles matching expected content shape
- Product feed: show 6 skeleton cards while loading

---

## 15. Accessibility

- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- All interactive elements must have visible focus indicators (`border-focus` green)
- All images must have alt text
- Form inputs must have associated labels
- Color must never be the only state indicator — always pair with icons or text
- Keyboard navigation must work for all core flows

---

*This design system supersedes all previous versions. Any references to amber/gold primary colors, Outfit/DM Sans/Caveat fonts, cement, iron, construction, wholesale, RFQ, or industrial aesthetics should be updated to match this document.*
