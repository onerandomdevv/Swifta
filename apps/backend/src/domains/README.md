# Backend Domain Boundaries

These modules are app-root boundaries. They group the existing feature modules
without moving files or changing feature-level imports.

- `CommerceDomainModule`: catalogue, cart, orders, inventory, fulfillment,
  reviews, wishlist, and reorder flows.
- `MoneyDomainModule`: escrow, Paystack, DVA, payouts, and trade financing.
- `UsersTrustDomainModule`: auth, profiles, supplier/merchant/buyer identity,
  verification, admin, and waitlist flows.
- `ChannelsDomainModule`: user-facing or external communication channels such
  as WhatsApp, USSD, notifications, email, and uploads. WhatsApp and USSD live
  under `src/channels` because they are extraction-ready channel
  infrastructure, not normal domain modules.
- `CoreModule`: application infrastructure such as config, logging, cache,
  static uploads, throttling, Prisma, Redis, and health checks.

When adding a new feature module, place it behind one of these domain modules
first. Import another feature module directly only when that feature's service is
needed; avoid using `AppModule` as the place where features learn about each
other.

For deeper stability notes, see `apps/backend/docs/STABILITY_ROADMAP.md`.
