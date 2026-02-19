# HARDWARE OS — Full Engineering Audit Report

**Author:** Dev A (AI Agent)
**Date:** February 19, 2026
**Branches:** `feature/order-hardening`, `feature/payment-paystack`, `feature/deployment-config`
**Build Status:** ✅ All phases pass `pnpm build`

---

## Executive Summary

| Phase              | Files Changed | Insertions | Deletions | Bugs Fixed | Status    |
| ------------------ | ------------- | ---------- | --------- | ---------- | --------- |
| 1. Auth            | Pre-existing  | —          | —         | —          | ✅ Merged |
| 2. Order Hardening | 2             | ~200       | ~100      | 9          | ✅ Merged |
| 3. Payment Rewrite | 6             | 595        | 84        | 12         | ✅ Merged |
| 4. Deployment      | 6             | ~180       | ~20       | 1          | ✅ Pushed |

**Total: 14 files, ~975 lines added, ~204 lines removed, 22 bugs fixed**

---

## Phase 1: Auth Module ✅

The Auth module was pre-built and wired before this session. Verified components:

- `AuthService` — register (bcrypt), login (JWT), refresh (Redis rotation), logout (Redis delete)
- Guards — `JwtAuthGuard`, `JwtRefreshGuard`, `RolesGuard`, `MerchantVerifiedGuard`
- Decorators — `@CurrentUser`, `@CurrentMerchant`, `@Roles`, `@IdempotencyKey`
- `MerchantContextMiddleware` — JWT payload extraction
- `GlobalExceptionFilter` — Prisma error handling
- `ResponseTransformInterceptor`, `AppValidationPipe`

**No bugs found — module was already production-ready.**

---

## Phase 2: Order Module Hardening

### Bugs Found & Fixes

#### Bug 1: Non-Atomic Order Creation

**Problem:** `createFromQuote()` created the order, then separately reserved inventory, then logged events. If inventory reservation failed mid-way, an orphaned order would exist with no inventory hold.

```diff
- const order = await this.prisma.order.create({ ... });
- await this.inventoryService.reserve(...);
- // No OrderEvent logged at all
+ const order = await this.prisma.$transaction(async (tx) => {
+   const newOrder = await tx.order.create({ ... });
+   await tx.orderEvent.create({ ... }); // Initial event
+   await tx.inventoryEvent.create({ ... }); // Reserve
+   await tx.productStockCache.update({ ... }); // Update cache
+   return newOrder;
+ });
```

**Impact:** Prevents orphaned orders and ensures data consistency.

---

#### Bug 2: No Idempotency on Order Creation

**Problem:** Calling `createFromQuote()` twice with the same quoteId would create duplicate orders.

```diff
+ // Idempotency: check if order already exists for this quote
+ const existing = await this.prisma.order.findUnique({
+   where: { quoteId },
+ });
+ if (existing) return existing;
```

---

#### Bug 3: Public `transition()` Method (Race Condition Risk)

**Problem:** `transition()` was public and only took `toStatus`, reading current status internally. Two concurrent calls could both read `PENDING_PAYMENT` and try to transition, causing inconsistency.

```diff
- async transition(orderId: string, toStatus: OrderStatus, ...) {
-   const order = await this.prisma.order.findUnique(...);
-   // reads current status here — race window
+ private async transition(
+   orderId: string,
+   fromStatus: OrderStatus, // caller specifies expected state
+   toStatus: OrderStatus,
+   triggeredBy: string,
+   metadata?: Record<string, any>,
+ ) {
```

---

#### Bug 4: Insecure OTP Generation

**Problem:** `dispatch()` used `Math.random()` for generating 6-digit delivery OTPs. `Math.random()` is **not** cryptographically secure — predictable in some JS engines.

```diff
- const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
+ import * as crypto from 'crypto';
+ const deliveryOtp = crypto.randomInt(100000, 999999).toString();
```

---

#### Bug 5: Missing Status Checks Before State Transitions

**Problem:** `dispatch()`, `confirmDelivery()`, and `dispute()` didn't verify the order was in the correct status before attempting transitions.

```diff
+ // dispatch: must be PAID
+ if (order.status !== OrderStatus.PAID) {
+   throw new BadRequestException('Order must be in PAID status to dispatch');
+ }

+ // confirmDelivery: must be DISPATCHED
+ if (order.status !== OrderStatus.DISPATCHED) {
+   throw new BadRequestException('Order must be DISPATCHED');
+ }

+ // dispute: must be DISPATCHED
+ if (order.status !== OrderStatus.DISPATCHED) {
+   throw new BadRequestException('Only DISPATCHED orders can be disputed');
+ }
```

---

#### Bug 6: No Role-Based Cancellation Rules

**Problem:** Any user could cancel any order in any status. The business rule says: buyer cancels only `PENDING_PAYMENT` (no refund), merchant cancels only `PAID` (triggers refund).

```diff
+ if (isBuyer && order.status !== OrderStatus.PENDING_PAYMENT) {
+   throw new BadRequestException('Buyer can only cancel PENDING_PAYMENT');
+ }
+ if (isMerchant && order.status !== OrderStatus.PAID) {
+   throw new BadRequestException('Merchant can only cancel PAID orders');
+ }
```

---

#### Bug 7: No Ownership Check on `getById()`

**Problem:** Any authenticated user could view any order by guessing the UUID.

```diff
+ if (order.buyerId !== userId && order.merchantId !== merchantId) {
+   throw new ForbiddenException('Access denied');
+ }
```

---

#### Bug 8: Controller Not Passing User Context

**Problem:** `findOne()` and `cancel()` in the controller didn't pass user identity to the service, making ownership and role checks impossible.

```diff
- findOne(@Param('id') id: string) {
-   return this.orderService.getById(id);
+ findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
+   return this.orderService.getById(id, user.sub, user.merchantId);

- cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
-   return this.orderService.cancel(user.sub, id);
+ cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
+   return this.orderService.cancel(user.sub, id, user.merchantId);
```

---

#### Bug 9: No Initial OrderEvent Logged

**Problem:** When an order was created, no `OrderEvent` was recorded. The audit trail started only when the first status change happened, missing the creation event.

**Fix:** Added `OrderEvent` creation inside the `$transaction` in `createFromQuote()`.

---

## Phase 3: Payment Module Rewrite

### Bugs Found & Fixes

#### Bug 10: PaystackClient Fully Stubbed

**Problem:** All 3 methods in `paystack.client.ts` returned hardcoded values. No actual HTTP calls to Paystack API.

```diff
- async initializeTransaction(...) {
-   return {
-     authorization_url: 'https://checkout.paystack.com/stub-url',
-     access_code: 'stub-access-code',
-     reference
-   };
- }
+ async initializeTransaction(...): Promise<PaystackInitResponse> {
+   const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
+     method: 'POST',
+     headers: this.headers,
+     body: JSON.stringify({ email, amount: Number(amountKobo), reference }),
+   });
+   const json = await response.json();
+   if (!json.status) throw new Error(`Paystack init failed: ${json.message}`);
+   return json.data;
+ }
```

**Also added:** `createTransferRecipient()` — new method needed for payouts.

---

#### Bug 11: No Idempotency on Payment Initialize

**Problem:** Every call to `POST /payments/initialize` created a new Payment record and Paystack transaction, even if one already existed for the order.

```diff
+ const existingPayment = await this.prisma.payment.findFirst({
+   where: { orderId: dto.orderId, direction: 'INFLOW', status: 'INITIALIZED' },
+ });
+ if (existingPayment) {
+   return { reference: existingPayment.paystackReference, message: 'Use existing' };
+ }
```

---

#### Bug 12: Hardcoded Callback URL

**Problem:** `http://localhost:3000/buyer/orders/payment/callback` was hardcoded.

```diff
- 'http://localhost:3000/buyer/orders/payment/callback'
+ const frontendUrl = this.config.get<string>('app.frontendUrl', 'http://localhost:3000');
+ const callbackUrl = `${frontendUrl}/buyer/orders/payment/callback`;
```

---

#### Bug 13: No Buyer Ownership Check

**Problem:** Any authenticated user could initialize payment for any order.

```diff
+ if (order.buyerId !== buyerId) {
+   throw new ForbiddenException('Access denied');
+ }
```

---

#### Bug 14: Webhook Processes Duplicate Events

**Problem:** If Paystack sends `charge.success` twice (retry), the system would process the payment twice.

```diff
+ if (payment.status === PaymentStatus.SUCCESS) {
+   this.logger.log(`Already processed, skipping`);
+   return { status: 'already_processed' };
+ }
```

---

#### Bug 15: No Amount Verification

**Problem:** `verifyTransaction()` never compared the amount Paystack reported vs the amount we expected. A compromised webhook could confirm a ₦100 payment for a ₦100,000 order.

```diff
+ const paystackAmountKobo = BigInt(verification.amount);
+ if (paystackAmountKobo !== payment.amountKobo) {
+   await this.prisma.paymentEvent.create({ data: { eventType: 'AMOUNT_MISMATCH', ... } });
+   throw new BadRequestException('Payment amount mismatch');
+ }
```

---

#### Bug 16: Bypasses Order State Machine

**Problem:** `verifyTransaction()` directly updated `order.status` via raw Prisma, bypassing the state machine validation and not logging an `OrderEvent`.

```diff
- await this.prisma.order.update({
-   where: { id: payment.orderId },
-   data: { status: OrderStatus.PAID }
- });
+ await this.orderService.transitionBySystem(
+   payment.orderId,
+   OrderStatus.PENDING_PAYMENT,
+   OrderStatus.PAID,
+   { paymentId: payment.id, reference },
+ );
```

---

#### Bug 17: No PaymentEvent Logging

**Problem:** No audit trail for payment status changes. The `PaymentEvent` table existed in the schema but was never written to.

**Fix:** Added `PaymentEvent` creation on every status change: `INITIALIZED`, `SUCCESS`, `FAILED`, `AMOUNT_MISMATCH`, `PAYOUT_INITIATED`.

---

#### Bug 18: Empty Payout Stub

**Problem:** `initiatePayout()` was an empty method with a comment `// Stub context`.

**Fix:** Full implementation:

1. Verify order is `COMPLETED`
2. Check merchant bank details exist
3. Create transfer recipient via Paystack API
4. Initiate transfer via Paystack API
5. Record PAYOUT Payment + PaymentEvent
6. Notify merchant

---

#### Bug 19: Webhook HMAC Uses `JSON.stringify`

**Problem:** `WebhookSignatureGuard` used `JSON.stringify(request.body)` for HMAC computation. If NestJS parsed and re-serialized the body, the byte sequence could differ from what Paystack signed, causing valid webhooks to be rejected.

```diff
- const hash = crypto.createHmac('sha512', secret)
-   .update(JSON.stringify(request.body))
-   .digest('hex');
- return hash === signature;
+ const body = request.rawBody || Buffer.from(JSON.stringify(request.body));
+ const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
+ return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
```

**Also:** Changed `===` to `crypto.timingSafeEqual()` to prevent timing attacks.

---

#### Bug 20: No `rawBody` in NestFactory

**Problem:** NestJS doesn't preserve the raw request body by default. The webhook guard needed `request.rawBody` but it was always `undefined`.

```diff
- const app = await NestFactory.create(AppModule);
+ const app = await NestFactory.create(AppModule, { rawBody: true });
```

---

#### Bug 21: No RolesGuard on Initialize Endpoint

**Problem:** Any role (MERCHANT, ADMIN) could initialize a payment. Only BUYER should be allowed.

```diff
- @UseGuards(JwtAuthGuard)
+ @UseGuards(JwtAuthGuard, RolesGuard)
+ @Roles(UserRole.BUYER)
```

---

## Phase 4: Deployment

#### Bug 22: Dockerfile Runner Copies Entire `/app`

**Problem:** The runner stage did `COPY --from=installer /app .` — copying source code, dev dependencies, and build artifacts into the production image.

```diff
- COPY --from=installer /app .
+ COPY --from=installer /app/apps/backend/dist ./apps/backend/dist
+ COPY --from=installer /app/apps/backend/package.json ./apps/backend/package.json
+ COPY --from=installer /app/apps/backend/src/prisma ./apps/backend/src/prisma
+ COPY --from=installer /app/packages ./packages
+ COPY --from=installer /app/node_modules ./node_modules
```

---

## Challenges Encountered & Solutions

### Challenge 1: Merge Conflict Between Order and Payment Branches

**Problem:** Both `feature/order-hardening` and `feature/payment-paystack` modified `order.service.ts`. The payment branch was based on dev (before order hardening was merged), so it added `transitionBySystem()` to the old version of the file.

**Solution:**

1. Merged `feature/order-hardening` into dev first
2. Deleted local `feature/payment-paystack`
3. Created fresh `feature/payment-paystack` from updated dev
4. Re-applied all payment changes on top of the hardened order service
5. Force-pushed with `--force-with-lease`

### Challenge 2: Git Stash Conflict on `CLAUDE.md`

**Problem:** `git pull` on dev failed because local changes to `CLAUDE.md` conflicted with remote. This file is confidential and shouldn't be in git at all.

**Solution:**

1. Stashed local changes
2. Added `CLAUDE.md` and `HARDWARE_OS_Backend_Fullstack_Guide.md` to `.gitignore`
3. Removed `CLAUDE.md` from git tracking with `git rm --cached`
4. Applied stash and continued

### Challenge 3: PowerShell `&&` Operator Not Supported

**Problem:** PowerShell (older versions) doesn't support `&&` for command chaining.

**Solution:** Ran commands sequentially instead of chaining.

### Challenge 4: TypeScript Lint — `error.message` on `unknown`

**Problem:** TypeScript strict mode doesn't know `catch (error)` is an `Error` instance — `error.message` fails type checking.

**Solution:**

```typescript
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
}
```

### Challenge 5: Git Commit Hanging

**Problem:** `git commit` command hung indefinitely with no output during deployment phase.

**Solution:** Terminated and retried — commit had actually been created. Verified with `git log` and proceeded with push.

---

## How to Test Everything

### Prerequisites

```bash
# Start local services
docker compose up -d   # Postgres + Redis

# Install dependencies
pnpm install

# Run migrations
npx prisma migrate deploy --schema=apps/backend/src/prisma/schema.prisma

# Start dev server
pnpm dev
```

### Phase 2: Order Module Tests

#### Test 1: Idempotent Order Creation

```bash
# Create order from quote (first call)
curl -X POST http://localhost:4000/orders/from-quote \
  -H "Authorization: Bearer <BUYER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"quoteId": "<ACCEPTED_QUOTE_ID>"}'

# Same call again → should return same order (not duplicate)
# Expected: 200 with same order ID
```

#### Test 2: Role-Based Cancellation

```bash
# Buyer cancels PENDING_PAYMENT order → should succeed
curl -X POST http://localhost:4000/orders/<ORDER_ID>/cancel \
  -H "Authorization: Bearer <BUYER_TOKEN>"

# Buyer tries to cancel PAID order → should fail
# Expected: 400 "Buyer can only cancel orders in PENDING_PAYMENT status"

# Merchant cancels PAID order → should succeed
curl -X POST http://localhost:4000/orders/<ORDER_ID>/cancel \
  -H "Authorization: Bearer <MERCHANT_TOKEN>"
```

#### Test 3: Ownership Check

```bash
# User A tries to view User B's order
curl http://localhost:4000/orders/<OTHER_USERS_ORDER> \
  -H "Authorization: Bearer <USER_A_TOKEN>"
# Expected: 403 "Access denied"
```

#### Test 4: Dispatch with Crypto OTP

```bash
# Merchant dispatches → generates 6-digit OTP
curl -X POST http://localhost:4000/orders/<ORDER_ID>/dispatch \
  -H "Authorization: Bearer <MERCHANT_TOKEN>"
# Verify: OTP is exactly 6 digits, different each time
```

### Phase 3: Payment Module Tests

#### Test 5: Idempotent Payment Initialize

```bash
# First call → creates payment, returns Paystack URL
curl -X POST http://localhost:4000/payments/initialize \
  -H "Authorization: Bearer <BUYER_TOKEN>" \
  -H "X-Idempotency-Key: test-key-1" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "<PENDING_PAYMENT_ORDER>"}'

# Second call same order → returns existing reference
# Expected: message "Payment already initialized"
```

#### Test 6: Buyer-Only Initialize

```bash
# Merchant tries to initialize payment → should fail
curl -X POST http://localhost:4000/payments/initialize \
  -H "Authorization: Bearer <MERCHANT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "<ORDER_ID>"}'
# Expected: 403 Forbidden
```

#### Test 7: Webhook Signature Verification

```bash
# Generate valid signature
SECRET="your-webhook-secret"
PAYLOAD='{"event":"charge.success","data":{"reference":"tx-xxx"}}'
SIG=$(echo -n $PAYLOAD | openssl dgst -sha512 -hmac $SECRET | cut -d' ' -f2)

# Valid webhook → should process
curl -X POST http://localhost:4000/payments/webhook \
  -H "X-Paystack-Signature: $SIG" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

# Invalid signature → should reject
curl -X POST http://localhost:4000/payments/webhook \
  -H "X-Paystack-Signature: invalid" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Expected: 403 Forbidden
```

#### Test 8: Duplicate Webhook (Idempotency)

```bash
# Send same webhook twice → second should return "already_processed"
# Check database: only ONE PaymentEvent with type SUCCESS
```

### Phase 4: Deployment Tests

#### Test 9: Health Endpoint

```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"2026-02-19T..."}
```

#### Test 10: Docker Build

```bash
docker build -f apps/backend/Dockerfile -t hardware-os-backend .
# Expected: builds successfully, image < 300MB
```

#### Test 11: CI Pipeline

```bash
# Push to dev or create PR → GitHub Actions should trigger
# Check: install → prisma validate → build all pass
```

### Database Verification Queries

After running tests, verify the audit trail:

```sql
-- Check OrderEvents (should have entries for every status change)
SELECT * FROM order_events ORDER BY created_at DESC LIMIT 20;

-- Check PaymentEvents (should have INITIALIZED, SUCCESS, etc.)
SELECT * FROM payment_events ORDER BY created_at DESC LIMIT 20;

-- Verify no duplicate orders per quote
SELECT quote_id, COUNT(*) FROM orders GROUP BY quote_id HAVING COUNT(*) > 1;

-- Verify no duplicate payments per order
SELECT order_id, direction, COUNT(*) FROM payments
WHERE direction = 'INFLOW'
GROUP BY order_id, direction HAVING COUNT(*) > 1;
```

---

## File Change Summary

### Phase 2 Files

| File                                                                                                                                                        | Lines | Key Changes                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| [order.service.ts](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/src/modules/order/order.service.ts)       | ~430  | 9 fixes: atomic create, crypto OTP, state checks, role cancel, ownership, `transitionBySystem()` |
| [order.controller.ts](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/src/modules/order/order.controller.ts) | ~55   | Passes user context to service                                                                   |

### Phase 3 Files

| File                                                                                                                                                                        | Lines | Key Changes                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------- |
| [paystack.client.ts](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/src/modules/payment/paystack.client.ts)                 | ~170  | Real HTTP, 4 methods, typed responses                |
| [payment.service.ts](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/src/modules/payment/payment.service.ts)                 | ~310  | Idempotent init, amount verify, PaymentEvent, payout |
| [webhook-signature.guard.ts](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/src/modules/payment/webhook-signature.guard.ts) | ~45   | rawBody + timingSafeEqual                            |
| [payment.controller.ts](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/src/modules/payment/payment.controller.ts)           | ~36   | RolesGuard + @Roles(BUYER)                           |
| [main.ts](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/src/main.ts)                                                       | ~34   | rawBody: true                                        |

### Phase 4 Files

| File                                                                                                                                                   | Lines | Key Changes                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ---------------------------------- |
| [Dockerfile](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/Dockerfile)                                | ~50   | Slim runner, NODE_ENV, HEALTHCHECK |
| [render.yaml](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/render.yaml)                                           | ~48   | Render Blueprint config            |
| [ci.yml](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/.github/workflows/ci.yml)                                   | ~36   | GitHub Actions pipeline            |
| [health.controller.ts](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/apps/backend/src/health/health.controller.ts) | ~12   | GET /health endpoint               |
| [.env.example](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/.env.example)                                         | ~45   | Section comments + prod hints      |
| [DEPLOYMENT.md](file:///c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/hardware-os/DEPLOYMENT.md)                                       | ~100  | Full deployment guide              |
