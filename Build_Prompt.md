# Swifta — Build Task: USSD Checkout + Paystack DVA

## INSTRUCTIONS FOR AI AGENT

You are building two features for Swifta's NestJS backend. Build them in order: USSD first, then DVA. Do NOT skip any step. Do NOT modify any existing logic that is working. Follow every pattern, naming convention, and architecture decision documented below — these are verified against the actual codebase.

**After building each feature, run these six commands. All must pass with ZERO errors before committing:**

```bash
cd apps/backend && pnpm run lint && npx tsc --noEmit && pnpm run build
cd apps/web && pnpm run lint && npx tsc --noEmit && pnpm run build
```

---

## CODEBASE FACTS (Verified — Do Not Deviate)

These are confirmed facts about the current codebase. Do not assume anything different.

### Database Schema

**Order model:**
- Total amount field: `totalAmountKobo` (BigInt)
- Buyer relation: `buyerId` (UUID → User)
- Status field: `status` using enum `OrderStatus`
- OrderStatus values: `PENDING_PAYMENT | PAID | DISPATCHED | DELIVERED | COMPLETED | CANCELLED | DISPUTE | PREPARING | IN_TRANSIT`
- Direct purchases: `productId` (UUID? → Product), `quantity` (Int?), `unitPriceKobo` (BigInt?)
- Cart purchases: `items` (Json?) — this is a JSON array, NOT a Prisma relation
- Payment method: `paymentMethod` using enum `PaymentMethod` — values: `ESCROW | DIRECT`
- Delivery OTP: `deliveryOtp` (String?)
- Has `product` relation for direct purchases (via `productId`)
- Has `idempotencyKey` (String, @unique)

**User model:**
- Phone: `phone` (String, @unique) — stored in **E.164 format** (e.g., `+2348012345678`)
- Email: `email` (String, @unique)
- Name: `firstName`, `lastName` (String, required)
- Role: `role` using enum `UserRole` — values: `BUYER | MERCHANT | SUPER_ADMIN | OPERATOR | SUPPORT | SUPPLIER`
- Relations: `buyerProfile?`, `merchantProfile?`, `supplierProfile?`

**BuyerProfile model:**
- `userId` (UUID, @unique → User)
- `buyerType` (String, default "CONSUMER")
- `onboardingStep` (Int, default 1)
- **No Paystack customer ID fields exist yet** — we will add them
- **No DVA fields exist yet** — we will add them

**Payment model:**
- `orderId` (UUID → Order)
- `paystackReference` (String, @unique)
- `amountKobo` (BigInt)
- `status` using enum `PaymentStatus` — values: `INITIALIZED | SUCCESS | FAILED | REFUNDED`
- `direction` using enum `PaymentDirection` — values: `INFLOW | PAYOUT`
- `idempotencyKey` (String, @unique)
- `verifiedAt` (DateTime?)
- Has `paymentEvents` relation

### NestJS Patterns

**Auth:** Auth is NOT a global guard. Routes without `@UseGuards(JwtAuthGuard)` are **public by default**. The only global guard is `ThrottlerGuard` (60 req/60s). To make a route public, simply do not add `@UseGuards()`. To skip rate limiting, use `@SkipThrottle()`.

**Response Interceptor:** `ResponseTransformInterceptor` wraps ALL responses in `{ success: true, data: T }`. To return plain text (required for USSD), use `@Res()` parameter decorator and call `res.send()` directly — this bypasses the interceptor. See `whatsapp.controller.ts` GET /whatsapp/webhook for the existing pattern.

**Validation Pipe:** Global `AppValidationPipe` with `whitelist: true`, `transform: true`. DTOs use `class-validator` decorators.

**Body Parsing:** `rawBody: true` is enabled in main.ts for Paystack webhook verification. Express default body parser handles `application/x-www-form-urlencoded` (which Africa's Talking uses for USSD callbacks).

**Logging:** Use NestJS `Logger` class — never `console.log`. Pattern: `private readonly logger = new Logger(ClassName.name);`

### Payment Architecture

**PaystackClient** (at `apps/backend/src/modules/payment/paystack.client.ts`):
- Uses **native fetch** (not axios, not an SDK)
- Config: `this.secretKey` and `this.baseUrl` from NestJS ConfigService
- Key method: `initializeTransaction(email: string, amountKobo: number, reference: string, callbackUrl: string)`
- Exported from `PaymentModule`

**PaymentService** (at `apps/backend/src/modules/payment/payment.service.ts`):
- `handleWebhook(payload)` processes Paystack webhook events
- Currently handles: `charge.success`, `transfer.success`, `transfer.failed`
- Webhook controller uses `WebhookSignatureGuard` (HMAC SHA-512 with `request.rawBody`)
- On `charge.success`: verifies amount, transitions order PENDING_PAYMENT → PAID, reserves inventory, generates deliveryOtp, queues payout for DIRECT payments
- Exported from `PaymentModule`

**PaymentModule** exports: `PaymentService`, `PaystackClient`

### SMS / Africa's Talking

- Package `africastalking` is **already installed**
- Config at `apps/backend/src/config/africastalking.config.ts`
- Env vars: `AT_USERNAME` (default: `sandbox`), `AT_API_KEY`, `AT_SENDER_ID`
- `SmsService` exists in `NotificationModule` at `apps/backend/src/modules/notification/sms.service.ts`
- Two separate AT SDK instances exist: one in `SmsService`, one in `AuthService` (both read from same config)

### WhatsApp Bot

- `WhatsAppInteractiveService` sends CTA URL Buttons (payment links) at `apps/backend/src/modules/whatsapp/whatsapp-interactive.service.ts`
- Buyer intent handler: `whatsapp-buyer-intent.service.ts`
- `WhatsAppBuyerLink` model maps WhatsApp phone → User (buyer)

### Legacy Package Name Warning

Some imports use `@hardware-os/shared` instead of `@swifta/shared`. Both resolve to the same package. When you create new files, check what the **neighboring files in the same directory** import from and use the same package name for consistency. Do NOT mix import styles within the same module.

---

## FEATURE 1: USSD CHECKOUT

**Branch:** `feat/ussd-checkout`

### What to Build

A USSD callback endpoint that Africa's Talking POSTs to when a buyer dials a shortcode. The buyer can pay for pending orders or check order status via USSD menu navigation.

### Files to Create

#### 1. `apps/backend/src/ussd/ussd.dto.ts`

```typescript
import { IsString, IsOptional } from 'class-validator';

export class UssdCallbackDto {
  @IsString()
  sessionId: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  serviceCode: string;

  @IsString()
  @IsOptional()
  text: string;
}
```

#### 2. `apps/backend/src/ussd/ussd.controller.ts`

**CRITICAL RULES:**
- NO `@UseGuards()` — this endpoint must be public (AT cannot authenticate)
- Use `@SkipThrottle()` — AT sends rapid sequential requests per session
- Use `@Res()` to bypass `ResponseTransformInterceptor` — AT expects plain text starting with `CON` or `END`, NOT JSON
- Set `Content-Type: text/plain` explicitly

```typescript
import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { UssdService } from './ussd.service';
import { UssdCallbackDto } from './ussd.dto';

@Controller('ussd')
@SkipThrottle()
export class UssdController {
  private readonly logger = new Logger(UssdController.name);

  constructor(private readonly ussdService: UssdService) {}

  @Post('callback')
  async handleCallback(
    @Body() dto: UssdCallbackDto,
    @Res() res: Response,
  ) {
    this.logger.log(
      `USSD callback | session: ${dto.sessionId} | phone: ${dto.phoneNumber} | text: ${dto.text}`,
    );

    const response = await this.ussdService.processSession(dto);

    res.set('Content-Type', 'text/plain');
    res.send(response);
  }
}
```

#### 3. `apps/backend/src/ussd/ussd.service.ts`

**CRITICAL RULES:**
- `Order.totalAmountKobo` is BigInt — convert with `Number()` for display
- `Order.items` is a Json field (array), NOT a relation — cannot use `include` on it
- Direct purchases have `productId` → use `include: { product: { select: { name: true } } }` to get the product name
- Cart purchases have `items` as a JSON array — parse the first item's name from it
- `User.phone` is E.164 format (`+2348012345678`) — the `toE164()` helper must convert any user input to this format
- Use `OrderStatus` enum value `'PENDING_PAYMENT'` (string) in Prisma where clause

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackClient } from '../modules/payment/paystack.client';
import { UssdCallbackDto } from './ussd.dto';

@Injectable()
export class UssdService {
  private readonly logger = new Logger(UssdService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackClient: PaystackClient,
  ) {}

  async processSession(dto: UssdCallbackDto): Promise<string> {
    const { sessionId, phoneNumber, text } = dto;
    const inputs = text ? text.split('*') : [];
    const level = inputs.length;

    this.logger.log(`Session ${sessionId} | level ${level} | text: ${text}`);

    try {
      // Level 0: Welcome menu
      if (level === 0) {
        return 'CON Welcome to Swifta\n1. Pay for an order\n2. Check order status';
      }

      const mainChoice = inputs[0];

      if (mainChoice === '1') return this.paymentFlow(inputs);
      if (mainChoice === '2') return this.statusFlow(inputs);

      return 'END Invalid selection. Please try again.';
    } catch (error) {
      this.logger.error(`USSD error: ${error.message}`, error.stack);
      return 'END An error occurred. Please try again later.';
    }
  }

  // ═══ PAYMENT FLOW ═══

  private async paymentFlow(inputs: string[]): Promise<string> {
    const level = inputs.length;

    // Level 1: Ask for phone
    if (level === 1) {
      return 'CON Enter the phone number linked to your Swifta account:';
    }

    // Level 2: Show pending orders
    if (level === 2) {
      const phone = this.toE164(inputs[1]);
      const user = await this.prisma.user.findFirst({ where: { phone } });

      if (!user) {
        return 'END No Swifta account found for this number. Visit swifta.store to register.';
      }

      const orders = await this.getPendingOrders(user.id);

      if (orders.length === 0) {
        return 'END You have no pending orders. Visit swifta.store to place an order.';
      }

      let response = 'CON Your pending orders:\n';
      orders.forEach((order, i) => {
        const name = this.getOrderProductName(order);
        const amount = this.koboToNaira(order.totalAmountKobo);
        const shortId = order.id.slice(-4).toUpperCase();
        response += `${i + 1}. #${shortId} - ${name} - N${amount}\n`;
      });

      return response;
    }

    // Level 3: Confirmation screen
    if (level === 3) {
      const phone = this.toE164(inputs[1]);
      const user = await this.prisma.user.findFirst({ where: { phone } });
      if (!user) return 'END Session expired. Please try again.';

      const orders = await this.getPendingOrders(user.id);
      const idx = parseInt(inputs[2], 10) - 1;

      if (idx < 0 || idx >= orders.length) {
        return 'END Invalid selection. Please try again.';
      }

      const order = orders[idx];
      const name = this.getOrderProductName(order);
      const amount = this.koboToNaira(order.totalAmountKobo);
      const shortId = order.id.slice(-4).toUpperCase();

      return [
        'CON Confirm payment for:',
        `Order #${shortId} - ${name}`,
        `Amount: N${amount}`,
        '',
        '1. Confirm and pay',
        '2. Cancel',
      ].join('\n');
    }

    // Level 4: Process payment or cancel
    if (level === 4) {
      if (inputs[3] === '2') {
        return 'END Payment cancelled. Your order is still pending.';
      }

      if (inputs[3] === '1') {
        const phone = this.toE164(inputs[1]);
        const user = await this.prisma.user.findFirst({ where: { phone } });
        if (!user) return 'END Session expired. Please try again.';

        const orders = await this.getPendingOrders(user.id);
        const idx = parseInt(inputs[2], 10) - 1;
        const order = orders[idx];
        if (!order) return 'END Order not found. Please try again.';

        // Initialize Paystack transaction — follows existing pattern
        const reference = `ussd_${order.id.slice(-8)}_${Date.now()}`;
        const callbackUrl = 'https://swifta.store/payment/callback';
        const result = await this.paystackClient.initializeTransaction(
          user.email,
          Number(order.totalAmountKobo),
          reference,
          callbackUrl,
        );

        // Create Payment record — matches existing payment creation pattern
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            paystackReference: reference,
            amountKobo: order.totalAmountKobo,
            status: 'INITIALIZED',
            direction: 'INFLOW',
            idempotencyKey: `ussd_pay_${order.id}_${Date.now()}`,
            paymentEvents: {
              create: {
                eventType: 'INITIALIZED',
                data: { channel: 'ussd', reference },
              },
            },
          },
        });

        // Send payment link via AT SMS
        if (result?.data?.authorization_url) {
          try {
            const AfricasTalking = require('africastalking');
            const at = AfricasTalking({
              apiKey: process.env.AT_API_KEY,
              username: process.env.AT_USERNAME || 'sandbox',
            });
            await at.SMS.send({
              to: [phone],
              message: `Swifta: Complete your payment of N${this.koboToNaira(order.totalAmountKobo)} here: ${result.data.authorization_url}`,
              from: process.env.AT_SENDER_ID || undefined,
            });
          } catch (smsErr) {
            this.logger.warn(`SMS send failed: ${smsErr.message}`);
          }
        }

        const shortId = order.id.slice(-4).toUpperCase();
        return [
          `END Payment initiated for Order #${shortId}.`,
          'You will receive a payment link via SMS shortly.',
          'Thank you for using Swifta.',
        ].join('\n');
      }

      return 'END Invalid selection.';
    }

    return 'END Session ended.';
  }

  // ═══ STATUS FLOW ═══

  private async statusFlow(inputs: string[]): Promise<string> {
    const level = inputs.length;

    if (level === 1) {
      return 'CON Enter the phone number linked to your Swifta account:';
    }

    if (level === 2) {
      const phone = this.toE164(inputs[1]);
      const user = await this.prisma.user.findFirst({ where: { phone } });

      if (!user) return 'END No Swifta account found for this number.';

      const orders = await this.prisma.order.findMany({
        where: { buyerId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (orders.length === 0) return 'END No orders found.';

      let response = 'END Your recent orders:\n';
      orders.forEach((order) => {
        const shortId = order.id.slice(-4).toUpperCase();
        response += `- #${shortId}: ${this.formatStatus(order.status)}\n`;
      });

      return response;
    }

    return 'END Session ended.';
  }

  // ═══ HELPERS ═══

  private async getPendingOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyerId: userId, status: 'PENDING_PAYMENT' },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }

  /**
   * Get product name from order.
   * Direct purchases: order.product.name (via productId relation)
   * Cart purchases: order.items is a Json array, use first item's name
   */
  private getOrderProductName(order: any): string {
    if (order.product?.name) {
      return this.truncate(order.product.name, 20);
    }

    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const firstItem = order.items[0] as any;
      const name = firstItem.productName || firstItem.name || 'Product';
      const suffix = order.items.length > 1 ? ` +${order.items.length - 1} more` : '';
      return this.truncate(name + suffix, 20);
    }

    return 'Order';
  }

  /**
   * Convert any phone format to E.164 to match User.phone in database.
   * DB stores: +2348012345678
   * User might enter: 08012345678, 2348012345678, +2348012345678, 8012345678
   */
  private toE164(phone: string): string {
    let cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('234')) return '+' + cleaned;
    if (cleaned.startsWith('0')) return '+234' + cleaned.slice(1);
    return '+234' + cleaned;
  }

  private koboToNaira(kobo: bigint | number): string {
    return (Number(kobo) / 100).toLocaleString('en-NG');
  }

  private truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max - 3) + '...' : text;
  }

  private formatStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING_PAYMENT: 'Awaiting payment',
      PAID: 'Paid - awaiting dispatch',
      PREPARING: 'Preparing',
      DISPATCHED: 'Dispatched',
      IN_TRANSIT: 'In transit',
      DELIVERED: 'Delivered',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      DISPUTE: 'Under dispute',
    };
    return map[status] || status;
  }
}
```

**IMPORTANT NOTE ON IMPORT PATHS:** The `ussd/` folder sits at `apps/backend/src/ussd/` — the same level as `prisma/` and `modules/`. Adjust relative import paths accordingly:
- PrismaService: `'../prisma/prisma.service'`
- PaystackClient: `'../modules/payment/paystack.client'`

If you place the folder inside `modules/` instead (at `apps/backend/src/modules/ussd/`), then:
- PrismaService: `'../../prisma/prisma.service'`
- PaystackClient: `'../payment/paystack.client'`

Pick one location and be consistent. Check where other modules live and follow the same pattern.

#### 4. `apps/backend/src/ussd/ussd.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { UssdController } from './ussd.controller';
import { UssdService } from './ussd.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../modules/payment/payment.module';

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [UssdController],
  providers: [UssdService],
})
export class UssdModule {}
```

**Adjust import paths based on where you placed the ussd/ folder (see note above).**

#### 5. Modify `apps/backend/src/app.module.ts`

Add UssdModule to the imports array:

```typescript
import { UssdModule } from './ussd/ussd.module';

@Module({
  imports: [
    // ... existing imports ...
    UssdModule,
  ],
})
export class AppModule {}
```

### USSD Verification Steps

1. Run all six lint/build commands — zero errors
2. Test locally with cURL:

```bash
# Welcome screen (level 0)
curl -X POST http://localhost:4000/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test1&phoneNumber=%2B2348012345678&serviceCode=*384*1234%23&text="

# Should return: CON Welcome to Swifta\n1. Pay for an order\n2. Check order status

# Select pay (level 1)
curl -X POST http://localhost:4000/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test1&phoneNumber=%2B2348012345678&serviceCode=*384*1234%23&text=1"

# Should return: CON Enter the phone number linked to your Swifta account:
```

3. Verify the response is **plain text** (not JSON wrapped in `{ success, data }`)
4. Verify phone lookup works — test with an actual phone number from your database
5. Commit:

```bash
git checkout -b feat/ussd-checkout
git add .
git commit -m "feat: add USSD checkout via Africa's Talking"
git push origin feat/ussd-checkout
```

---

## FEATURE 2: PAYSTACK DVA

**Branch:** `feat/paystack-dva` (create from dev AFTER USSD is merged)

### What to Build

Dedicated Virtual Accounts that give each buyer a permanent bank account number. When a buyer transfers money to their DVA, Paystack automatically creates a transaction and sends a `charge.success` webhook — which your existing payment flow already handles.

### Step 1: Prisma Migration

Add DVA fields to BuyerProfile in `apps/backend/prisma/schema.prisma`:

```prisma
model BuyerProfile {
  // ... ALL existing fields stay exactly as they are ...

  // Paystack DVA fields (NEW — add these after existing fields)
  paystackCustomerId    String?   @map("paystack_customer_id")
  paystackCustomerCode  String?   @map("paystack_customer_code")
  dvaAccountNumber      String?   @map("dva_account_number")
  dvaAccountName        String?   @map("dva_account_name")
  dvaBankName           String?   @map("dva_bank_name")
  dvaBankSlug           String?   @map("dva_bank_slug")
  dvaActive             Boolean   @default(false) @map("dva_active")
}
```

Run:

```bash
cd apps/backend
npx prisma migrate dev --name add-dva-fields-to-buyer-profile
npx prisma generate
```

**NEVER use `prisma db push` or `prisma db push --accept-data-loss`. Migration only.**

### Step 2: Add DVA Methods to PaystackClient

File: `apps/backend/src/modules/payment/paystack.client.ts`

Add these three methods to the **existing** PaystackClient class. Follow the same `fetch` pattern used by `initializeTransaction()`:

```typescript
// Add inside the existing PaystackClient class

/**
 * Create a Paystack customer (required before DVA)
 */
async createCustomer(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}): Promise<any> {
  const response = await fetch(`${this.baseUrl}/customer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
    }),
  });
  return response.json();
}

/**
 * Create a Dedicated Virtual Account for a customer
 * Auto-detects test mode and uses 'test-bank' accordingly
 */
async createDedicatedVirtualAccount(customerCode: string): Promise<any> {
  const isTestMode = this.secretKey.startsWith('sk_test_');
  const response = await fetch(`${this.baseUrl}/dedicated_account`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: customerCode,
      preferred_bank: isTestMode ? 'test-bank' : 'wema-bank',
    }),
  });
  return response.json();
}
```

**IMPORTANT:** Check how `this.baseUrl` and `this.secretKey` are defined in the existing PaystackClient constructor. Use the exact same property names. The architecture analysis shows they come from ConfigService via `paystack.secretKey` and `paystack.baseUrl`.

### Step 3: Create DVA Service

File: `apps/backend/src/modules/dva/dva.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaystackClient } from '../payment/paystack.client';

@Injectable()
export class DvaService {
  private readonly logger = new Logger(DvaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackClient: PaystackClient,
  ) {}

  /**
   * Create a DVA for a buyer.
   * Creates Paystack customer first if needed, then requests DVA.
   * DVA details arrive asynchronously via webhook.
   */
  async createDvaForBuyer(userId: string): Promise<{
    message: string;
    accountNumber?: string;
    bankName?: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true },
    });

    if (!user || !user.buyerProfile) {
      return { message: 'User not found or not a buyer' };
    }

    // Return existing DVA if already active
    if (user.buyerProfile.dvaAccountNumber && user.buyerProfile.dvaActive) {
      return {
        message: 'DVA already exists',
        accountNumber: user.buyerProfile.dvaAccountNumber,
        bankName: user.buyerProfile.dvaBankName || 'Wema Bank',
      };
    }

    try {
      // Step 1: Create Paystack customer if not exists
      let customerCode = user.buyerProfile.paystackCustomerCode;

      if (!customerCode) {
        this.logger.log(`Creating Paystack customer for user ${userId}`);

        const customerResult = await this.paystackClient.createCustomer({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        });

        if (!customerResult.status) {
          this.logger.error(`Paystack customer creation failed: ${JSON.stringify(customerResult)}`);
          return { message: 'Failed to create payment profile. Please try again.' };
        }

        customerCode = customerResult.data.customer_code;

        await this.prisma.buyerProfile.update({
          where: { userId: user.id },
          data: {
            paystackCustomerId: String(customerResult.data.id),
            paystackCustomerCode: customerCode,
          },
        });

        this.logger.log(`Paystack customer created: ${customerCode}`);
      }

      // Step 2: Create DVA
      this.logger.log(`Creating DVA for customer ${customerCode}`);

      const dvaResult = await this.paystackClient.createDedicatedVirtualAccount(customerCode);

      if (!dvaResult.status) {
        this.logger.error(`DVA creation failed: ${JSON.stringify(dvaResult)}`);
        return { message: 'Failed to create virtual account. Please try again.' };
      }

      // DVA creation is async — details arrive via webhook
      // (dedicatedaccount.assign.success event)
      return { message: 'Virtual account is being created. You will be notified when ready.' };

    } catch (error) {
      this.logger.error(`DVA error: ${error.message}`, error.stack);
      return { message: 'An error occurred. Please try again.' };
    }
  }

  /**
   * Handle dedicatedaccount.assign.success webhook from Paystack
   */
  async handleDvaAssigned(data: any): Promise<void> {
    const dedicatedAccount = data.dedicated_account;
    const customer = data.customer;

    if (!dedicatedAccount || !customer) {
      this.logger.warn('DVA webhook: missing dedicated_account or customer');
      return;
    }

    const buyerProfile = await this.prisma.buyerProfile.findFirst({
      where: { paystackCustomerCode: customer.customer_code },
    });

    if (!buyerProfile) {
      this.logger.warn(`DVA webhook: no buyer for customer ${customer.customer_code}`);
      return;
    }

    await this.prisma.buyerProfile.update({
      where: { userId: buyerProfile.userId },
      data: {
        dvaAccountNumber: dedicatedAccount.account_number,
        dvaAccountName: dedicatedAccount.account_name,
        dvaBankName: dedicatedAccount.bank?.name || 'Wema Bank',
        dvaBankSlug: dedicatedAccount.bank?.slug || 'wema-bank',
        dvaActive: true,
      },
    });

    this.logger.log(
      `DVA assigned: ${dedicatedAccount.account_number} for buyer ${buyerProfile.userId}`,
    );
  }

  /**
   * Handle dedicatedaccount.assign.failed webhook from Paystack
   */
  async handleDvaFailed(data: any): Promise<void> {
    this.logger.error(`DVA assignment failed: ${JSON.stringify(data)}`);
  }

  /**
   * Get DVA details for a buyer (used by WhatsApp bot and web)
   */
  async getDvaForBuyer(userId: string) {
    const profile = await this.prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!profile?.dvaAccountNumber || !profile.dvaActive) return null;

    return {
      accountNumber: profile.dvaAccountNumber,
      accountName: profile.dvaAccountName || '',
      bankName: profile.dvaBankName || '',
    };
  }
}
```

### Step 4: Create DVA Controller

File: `apps/backend/src/modules/dva/dva.controller.ts`

```typescript
import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { DvaService } from './dva.service';

// IMPORTANT: Check exact import paths for guards and decorators.
// Look at a neighboring controller (e.g., buyer controller) and copy the import pattern.
// It might be from '@hardware-os/shared' or '../../common/guards/...'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('buyer/dva')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class DvaController {
  constructor(private readonly dvaService: DvaService) {}

  @Post('create')
  async createDva(@Req() req: any) {
    return this.dvaService.createDvaForBuyer(req.user.id);
  }

  @Get()
  async getDva(@Req() req: any) {
    return this.dvaService.getDvaForBuyer(req.user.id);
  }
}
```

### Step 5: Create DVA Module

File: `apps/backend/src/modules/dva/dva.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { DvaService } from './dva.service';
import { DvaController } from './dva.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [DvaController],
  providers: [DvaService],
  exports: [DvaService],
})
export class DvaModule {}
```

### Step 6: Add DVA Webhook Events to PaymentService

File: `apps/backend/src/modules/payment/payment.service.ts`

You need to:

1. Import DvaService and inject it into PaymentService
2. Add DvaModule to PaymentModule imports (handle circular dependency — see below)
3. Add two new webhook event cases

**Circular Dependency Solution:**

PaymentModule exports PaystackClient. DvaModule imports PaymentModule. Now PaymentService needs DvaService — that's circular.

Use `forwardRef()`:

In `apps/backend/src/modules/payment/payment.module.ts`:
```typescript
import { forwardRef } from '@nestjs/common';
import { DvaModule } from '../dva/dva.module';

@Module({
  imports: [
    // ... existing imports ...
    forwardRef(() => DvaModule),
  ],
  // ... rest stays the same
})
```

In `apps/backend/src/modules/dva/dva.module.ts`:
```typescript
import { forwardRef } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PaymentModule),
  ],
  // ... rest stays the same
})
```

In PaymentService constructor:
```typescript
import { Inject, forwardRef } from '@nestjs/common';
import { DvaService } from '../dva/dva.service';

// In constructor:
@Inject(forwardRef(() => DvaService))
private readonly dvaService: DvaService,
```

Then in the `handleWebhook()` method, find where it switches on event type and add:

```typescript
// Add these cases alongside existing charge.success, transfer.success, etc.

case 'dedicatedaccount.assign.success':
  await this.dvaService.handleDvaAssigned(payload.data);
  break;

case 'dedicatedaccount.assign.failed':
  await this.dvaService.handleDvaFailed(payload.data);
  break;
```

**IMPORTANT:** Look at how the existing webhook handler switches on event types. It might use `if/else if`, a `switch` statement, or `payload.event`. Match the exact pattern. Do NOT restructure the existing handler — just add the new cases.

### Step 7: Register DvaModule in AppModule

File: `apps/backend/src/app.module.ts`

```typescript
import { DvaModule } from './modules/dva/dva.module';

@Module({
  imports: [
    // ... existing imports ...
    DvaModule,
  ],
})
```

### DVA Verification Steps

1. Run `npx prisma migrate dev --name add-dva-fields-to-buyer-profile` — verify migration succeeds
2. Run all six lint/build commands — zero errors
3. Test DVA creation:
   - Log in as a test buyer
   - Call `POST /buyer/dva/create` with JWT token
   - Check Paystack dashboard — customer should be created
   - Check database — `paystackCustomerCode` should be stored on BuyerProfile
4. Test DVA webhook:
   - Wait for `dedicatedaccount.assign.success` webhook (or simulate it)
   - Check database — DVA fields should be populated on BuyerProfile
5. Test payment via DVA:
   - Use Paystack demo bank app to transfer to the test virtual account
   - Verify `charge.success` webhook fires
   - Verify order transitions to PAID
6. Commit:

```bash
git checkout -b feat/paystack-dva
git add .
git commit -m "feat: add Paystack DVA for zero-friction bank transfer payments"
git push origin feat/paystack-dva
```

---

## FINAL CHECKLIST

Before considering either feature done:

- [ ] All six lint/build commands pass with zero errors
- [ ] No `console.log` in any new code — use Logger only
- [ ] No `any` types where proper types can be used (DTOs, return types)
- [ ] All new files follow existing import patterns (check `@hardware-os/shared` vs `@swifta/shared`)
- [ ] USSD endpoint returns plain text, not JSON
- [ ] USSD endpoint has no auth guard
- [ ] USSD endpoint has @SkipThrottle()
- [ ] DVA migration uses `prisma migrate dev`, not `db push`
- [ ] DVA fields use `@@map("snake_case")` convention
- [ ] forwardRef() used correctly for circular dependency between PaymentModule and DvaModule
- [ ] Webhook handler additions don't break existing charge.success or transfer event handling
- [ ] No existing code logic has been modified or restructured — only additions
