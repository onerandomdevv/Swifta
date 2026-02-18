# @hardware-os/shared

Shared types, enums, constants, and utilities used by both the backend and frontend.

---

## Installation

This package is automatically available in the monorepo. Import using:

```typescript
import { OrderStatus, formatKobo } from "@hardware-os/shared";
import type { Product, ApiResponse } from "@hardware-os/shared";
```

---

## What's Inside

### Enums (`src/enums/`)

| Enum                  | Values                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UserRole`            | BUYER, MERCHANT                                                                                                                                                  |
| `OrderStatus`         | PENDING_PAYMENT, PAID, DISPATCHED, DELIVERED, COMPLETED, CANCELLED, DISPUTE                                                                                      |
| `RFQStatus`           | OPEN, QUOTED, ACCEPTED, DECLINED, EXPIRED, CANCELLED                                                                                                             |
| `QuoteStatus`         | PENDING, ACCEPTED, DECLINED, EXPIRED, WITHDRAWN                                                                                                                  |
| `PaymentStatus`       | INITIALIZED, SUCCESS, FAILED, REFUNDED                                                                                                                           |
| `PaymentDirection`    | INFLOW, PAYOUT                                                                                                                                                   |
| `VerificationStatus`  | UNVERIFIED, PENDING, VERIFIED                                                                                                                                    |
| `InventoryEventType`  | STOCK_IN, STOCK_OUT, ADJUSTMENT, ORDER_RESERVED, ORDER_RELEASED                                                                                                  |
| `NotificationType`    | NEW_RFQ, QUOTE_RECEIVED, QUOTE_ACCEPTED, QUOTE_DECLINED, RFQ_EXPIRED, PAYMENT_CONFIRMED, ORDER_CANCELLED, ORDER_DISPATCHED, DELIVERY_CONFIRMED, PAYOUT_INITIATED |
| `NotificationChannel` | IN_APP, EMAIL                                                                                                                                                    |

### Types (`src/types/`)

TypeScript interfaces for all entities: `Product`, `RFQ`, `Quote`, `Order`, `OrderEvent`, `Payment`, `PaymentEvent`, `InventoryEvent`, `Notification`, `MerchantProfile`.

DTO types: `RegisterDto`, `LoginDto`, `CreateProductDto`, `CreateRFQDto`, `SubmitQuoteDto`, `InitializePaymentDto`, etc.

API response wrappers: `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`.

### Constants (`src/constants/`)

- **`ORDER_TRANSITIONS`** — Map of allowed order state transitions. Used by the backend state machine and available to frontend for UI logic.
- **`RFQ_EXPIRY_HOURS`** — 72 hours
- **`OTP_LENGTH`** — 6 digits
- **`DEFAULT_CURRENCY`** — "NGN"
- **`QUOTE_DEFAULT_VALIDITY_HOURS`** — 48 hours

### Utilities (`src/utils/`)

**Money formatting:**

```typescript
import { formatKobo, koboToNaira, nairaToKobo } from "@hardware-os/shared";

formatKobo(650000n); // "₦6,500.00"
koboToNaira(650000n); // "₦6,500.00" (alias)
nairaToKobo(6500); // 650000n
```

---

## Important: Shared Types vs Backend DTOs

This package contains **plain TypeScript interfaces** (no decorators):

```typescript
// packages/shared — plain interface
interface RegisterDto {
  email: string;
  phone: string;
  password: string;
}
```

The backend has **class-validator decorated classes** in `apps/backend/src/modules/*/dto/`:

```typescript
// apps/backend — validated class
class RegisterDto {
  @IsEmail() email: string;
  @IsString() phone: string;
}
```

Both exist and both are needed. The shared types define the SHAPE. The backend DTOs enforce VALIDATION.

---

## Building

```bash
pnpm --filter @hardware-os/shared build
```
