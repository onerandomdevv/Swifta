# Backend Stability Roadmap

This repo now has app-root domain modules and dedicated `src/channels`
boundaries for WhatsApp and USSD. The remaining stability work should be done in
small, testable steps.

## Coupling Rules

- `AppModule` should import only core/infrastructure and domain wrapper modules.
- Feature modules can import other feature modules only when they need a public
  service exported by that module.
- Prefer a small shared provider module over importing a whole feature boundary
  for one client. Example: `DvaModule` imports `PaystackModule`, not the full
  `PaymentModule`.
- Treat every new `forwardRef` as a design smell. It may be acceptable, but it
  should have a reason.

## Architecture Tasks

1. Keep channel entry points under `src/channels`.
   - Done: WhatsApp lives in `src/channels/whatsapp`.
   - Done: USSD lives in `src/channels/ussd`.
   - Later: add `src/channels/sms` only if SMS becomes an inbound command
     interface instead of notification delivery.
2. Keep business capabilities under `src/modules`.
   - Commerce: catalogue, cart, orders, inventory, fulfillment, reviews.
   - Money: payment, payout, DVA, escrow, platform fees.
   - Users/trust: auth, buyer, merchant, supplier, verification, admin.
3. Extract provider clients when they are shared by multiple domains.
   - Done: `PaystackModule` wraps `PaystackClient` under
     `src/integrations/paystack`.
   - Later: consider `integrations/meta-whatsapp`, `integrations/cloudinary`,
     `integrations/resend`, and `integrations/africastalking` if provider code
     starts spreading across modules.
4. Create a money ledger boundary before adding more payment/payout behavior.
   - Done: `LedgerModule` owns checkout fee totals, payout breakdowns, and
     available-balance calculations.
   - Done: `ledger_entries` stores append-only checkout, payment, platform fee,
     escrow, and payout events.
   - Done: ledger entries use deterministic idempotency keys so repeated
     webhooks/retries upsert the same money fact instead of creating duplicates.
5. Clean legacy RFQ/quote database objects only through a dedicated cleanup
   migration after data ownership is confirmed.

## WhatsApp Boundary

WhatsApp lives under `apps/backend/src/channels/whatsapp` and is split
internally into:

- `WhatsAppSharedModule`: Meta API helpers, intent parsing, image search, and
  channel logging.
- `WhatsAppAuthFlowsModule`: WhatsApp account linking and onboarding.
- `WhatsAppBuyerModule`: buyer chat flows.
- `WhatsAppSupplierChannelModule`: supplier chat flows.
- `WhatsAppModule`: public controller, queue processor, and top-level routing
  service.

Future changes should add new WhatsApp flows to the smallest internal module
that owns the behavior.

## Money Boundary

The first cycle reduction is complete: `PaystackClient` lives in
`src/integrations/paystack`, so DVA, payment, payout, and merchant bank setup
can share Paystack without treating it as part of the payment feature.
`LedgerModule` now owns core money calculations used by order creation, payout
initiation, and manual payout requests. It also records append-only ledger
entries for checkout creation, payment initialization, successful payment,
assessed platform fees, escrow holds, payout initiation, and payout
completion/failure. `LedgerService.getOrderTimeline()` provides a chronological
view of an order's money events.

Next money hardening step:

1. Add integration tests around Paystack payment/transfer webhook handlers.
2. Move webhook-driven state changes further toward ledger entries plus
   order/payment projections.
3. Add refund ledger entries when refund behavior is implemented.

## Legacy Database Objects

Neon still has legacy RFQ/quote tables and enum values. They were intentionally
preserved during drift repair.

Before removing them:

1. Confirm no production data is needed.
2. Export/archive relevant rows if needed.
3. Create a dedicated cleanup migration.
4. Test the cleanup on a Neon branch.
5. Apply with `pnpm exec prisma migrate deploy`.
