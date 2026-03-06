This SwiftTrade V1 Design System Specification serves as the technical blueprint for implementing the high-contrast, utilitarian B2B platform across mobile and desktop.

1. Core Philosophy & Aesthetic Rules
Mission: A "No-Nonsense" industrial tool for high-value commerce. The UI must feel as stable and heavy as the materials (cement, iron) being sold.
Theme: Strict Light Mode. High-contrast (minimum 4.5:1 ratio).
Visual Language:
Borders: Solid 1px or 1.5px borders (#D1D5DB or #E5E7EB). No "soft" borders.
Corners: Sharp (4px radius max) to convey precision and industrial strength.
Shadows: Submerged or flat shadows only. Use box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1). No large, blurry elevations.
Effects: Zero Glassmorphism, Zero Bubbly/Rounded UI, Zero gradients.

2. Color Palette
Backgrounds: Primary: #FFFFFF (White), Secondary: #F9FAFB (Light Gray).
Brand Primary: #1E3A8A (Deep Industrial Blue) or #C2410C (Industrial Orange) for Call-to-Actions (CTAs).
Status Colors:
Success/Paid: #15803D (Forest Green).
Alert/Low Stock: #B91C1C (Strong Red).
In-Transit: #0369A1 (Steel Blue).
Typography: Primary: #111827 (Almost Black), Secondary: #4B5563 (Slate Gray).

3. Layout & Navigation Patterns
Mobile Navigation: 5-item bottom bar (Catalogue, Quotes, Orders, Messages, Profile).
Desktop Navigation: 240px fixed left-side vertical navigation rail. Persistent and solid.
Command Center (State Machine): All order-related screens follow a strict 4-stage pipeline:
Pending Quotes: Negotiation phase.
Awaiting Dispatch: Escrow funded, stock preparation.
In Transit: Material moving, driver on-site.
Payout Completed: Transaction closed.

4. Component Specifications
The Quote Card (RFQ Thread):
A structured container with explicit fields: Unit Price, Delivery Fee, Total, and Expiry Date.
Must use tabular alignment for numbers to look like an official invoice.
The OTP Pad (Escrow Release):
High-contrast 6-digit input. Each digit in a separate box with a 2px border.
Large, touch-friendly targets for use in outdoor, dusty construction environments.
The Data Table (Inventory/Management):
Dense, high-information rows.
Sticky headers. High-contrast row-hover state (#F3F4F6).
No "hidden" actions. Every row should have visible 'Edit' or 'Update' buttons.

5. Critical Product Rules
No Price Visibility: Prices are never shown in the Public Catalogue. They only appear within the private Negotiation Thread or on a Quote Card.
CTA Priority: The primary action is always 'Request Quote' or 'Send RFQ'. There is no 'Cart' functionality.

The Typography Scale & Text Hierarchy has been defined to ensure maximum legibility for merchants and contractors, even in high-glare outdoor environments:

Typography Scale & Text Hierarchy: A technical documentation screen that specifies an industrial font system. It uses a clean, bold sans-serif for headings and a monospaced font for data-heavy fields (like SKUs and Naira amounts) to ensure tabular alignment and precision.
SwiftTrade V1 Typography Scale
Role	Desktop Size	Mobile Size	Weight	Line Height	Usage
H1 - Dashboard Title	32px	24px	700 (Bold)	1.2	Main Page Titles
H2 - Section Header	24px	20px	600 (Semi)	1.3	Kanban Columns, Card Titles
H3 - Card Subhead	18px	16px	600 (Semi)	1.4	Product Names, Escrow Balance
Body - Standard	16px	16px	400 (Reg)	1.5	Chat Threads, Product Details
Body - Small	14px	14px	400 (Reg)	1.5	Merchant Names, Metadata
Data / Monospace	14px	14px	500 (Med)	1.0	SKUs, Prices, OTP Codes
Button Text	16px	16px	600 (Semi)	1.0	Request Quote, Generate OTP
Implementation Note: Use Inter or System Sans-Serif for standard text and Roboto Mono or IBM Plex Mono for currency and SKU data to maintain that "banking/logistics" feel.

6. Tech Stack & Implementation Standards
Next.js Architecture:
- Global layouts (MerchantHeader, MerchantSidebar) reside in `apps/web/src/components/layout/`.
- Merchant Dashboard modular components (KanbanColumn, KanbanRfqCard, KanbanOrderCard) must perfectly replicate the B2B Stitch design and reside in `apps/web/src/components/merchant/dashboard/`.
- Page views (like `page.tsx`) should act as data-fetching containers (`useMerchantDashboard`) and layout shells, passing data down to pure presentation components without injecting redundant old KPI grids unless explicitly designed.

BigInt Serialization:
Our NestJS backend and shared types use `BigInt` for high-precision financial data (Naira/Kobo). In API boundaries and testing containers, ensure `BigInt.prototype.toJSON` is properly patched or manually converted to strings, as `JSON.stringify` natively throws errors on BigInt values. When extracting values on the frontend, always parse `totalAmountKobo` into a formatting utility (like `formatKobo` from `@hardware-os/shared`) rather than displaying raw integers.