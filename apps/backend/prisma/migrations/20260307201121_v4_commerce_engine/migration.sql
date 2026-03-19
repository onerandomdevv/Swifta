/*
  V4 Commerce Engine — Safe Migration
  
  This migration has been made safe for production by:
  1. Using temp-column swap for order_tracking.status (was DROP+ADD which fails with existing rows)
  2. Using temp-column swap for verification_requests.id_type and status
  3. Adding missing supplier FK columns to orders table
  4. Using snake_case column names (is_verified, is_active) for supplier tables
  5. Adding proper FK constraints for all relations
*/

-- CreateEnum
CREATE TYPE "VerificationIdType" AS ENUM ('NIN', 'VOTERS_CARD', 'PASSPORT');

-- CreateEnum
CREATE TYPE "VerificationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('MERCHANT_DELIVERY', 'PLATFORM_LOGISTICS');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVING', 'DELIVERED', 'FAILED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPPLIER';

-- AlterTable: Drop old verification column from merchant_profiles (no data loss — this was a JSON blob replaced by VerificationRequest model)
ALTER TABLE "merchant_profiles" DROP COLUMN IF EXISTS "verification";

-- =============================================================================
-- SAFE: order_tracking.status — Old type was text/varchar, new type is "OrderStatus" enum
-- Strategy: add new column with DEFAULT, backfill, set NOT NULL, drop old
-- =============================================================================
ALTER TABLE "order_tracking" ADD COLUMN IF NOT EXISTS "status_new" "OrderStatus" DEFAULT 'PREPARING';

-- Backfill: map any existing text values to OrderStatus; unknown values default to PREPARING
UPDATE "order_tracking" SET "status_new" = CASE
  WHEN "status"::text = 'PENDING_PAYMENT' THEN 'PENDING_PAYMENT'::"OrderStatus"
  WHEN "status"::text = 'PAID'            THEN 'PAID'::"OrderStatus"
  WHEN "status"::text = 'PREPARING'       THEN 'PREPARING'::"OrderStatus"
  WHEN "status"::text = 'IN_TRANSIT'      THEN 'IN_TRANSIT'::"OrderStatus"
  WHEN "status"::text = 'DISPATCHED'      THEN 'DISPATCHED'::"OrderStatus"
  WHEN "status"::text = 'DELIVERED'       THEN 'DELIVERED'::"OrderStatus"
  WHEN "status"::text = 'COMPLETED'       THEN 'COMPLETED'::"OrderStatus"
  WHEN "status"::text = 'CANCELLED'       THEN 'CANCELLED'::"OrderStatus"
  WHEN "status"::text = 'DISPUTE'         THEN 'DISPUTE'::"OrderStatus"
  ELSE 'PREPARING'::"OrderStatus"
END
WHERE "status_new" IS NULL OR "status_new" = 'PREPARING';

-- Ensure no NULLs remain
UPDATE "order_tracking" SET "status_new" = 'PREPARING' WHERE "status_new" IS NULL;

-- Drop old column and rename new one
ALTER TABLE "order_tracking" DROP COLUMN "status";
ALTER TABLE "order_tracking" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "order_tracking" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "order_tracking" ALTER COLUMN "status" DROP DEFAULT;

-- =============================================================================
-- SAFE: verification_requests.id_type — Old type was text, new type is "VerificationIdType" enum
-- =============================================================================
ALTER TABLE "verification_requests" ADD COLUMN IF NOT EXISTS "id_type_new" "VerificationIdType";

-- Backfill: map old string values to new enum values
UPDATE "verification_requests" SET "id_type_new" = CASE
  WHEN "id_type"::text = 'NIN'          THEN 'NIN'::"VerificationIdType"
  WHEN "id_type"::text = 'VOTERS_CARD'  THEN 'VOTERS_CARD'::"VerificationIdType"
  WHEN "id_type"::text = 'PASSPORT'     THEN 'PASSPORT'::"VerificationIdType"
  ELSE NULL -- nullable column, keep NULL if no valid mapping
END
WHERE "id_type" IS NOT NULL;

ALTER TABLE "verification_requests" DROP COLUMN "id_type";
ALTER TABLE "verification_requests" RENAME COLUMN "id_type_new" TO "id_type";

-- =============================================================================
-- SAFE: verification_requests.status — Old type was "VerificationStatus" enum, new type is "VerificationRequestStatus"
-- =============================================================================
ALTER TABLE "verification_requests" ADD COLUMN IF NOT EXISTS "status_new" "VerificationRequestStatus" DEFAULT 'PENDING';

-- Backfill: map old enum values to new enum values
UPDATE "verification_requests" SET "status_new" = CASE
  WHEN "status"::text = 'PENDING'   THEN 'PENDING'::"VerificationRequestStatus"
  WHEN "status"::text = 'APPROVED'  THEN 'APPROVED'::"VerificationRequestStatus"
  WHEN "status"::text = 'REJECTED'  THEN 'REJECTED'::"VerificationRequestStatus"
  ELSE 'PENDING'::"VerificationRequestStatus"
END;

ALTER TABLE "verification_requests" DROP COLUMN "status";
ALTER TABLE "verification_requests" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "verification_requests" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "verification_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Drop old enum only after all references have been migrated
DROP TYPE IF EXISTS "public"."VerificationStatus";

-- =============================================================================
-- AlterTable: orders — ADD new supplier columns + delivery_method
-- =============================================================================
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_method" "DeliveryMethod";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "supplier_id" UUID;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "supplier_product_id" UUID;

-- Make merchant_id nullable (it already is in schema.prisma)
ALTER TABLE "orders" ALTER COLUMN "merchant_id" DROP NOT NULL;

-- =============================================================================
-- CreateTable: audit_logs
-- =============================================================================
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bnpl_waitlists
CREATE TABLE IF NOT EXISTS "bnpl_waitlists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnpl_waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable: delivery_bookings
CREATE TABLE IF NOT EXISTS "delivery_bookings" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "method" "DeliveryMethod" NOT NULL,
    "partner_name" TEXT,
    "partner_ref" TEXT,
    "tracking_url" TEXT,
    "pickup_address" TEXT NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "estimated_cost_kobo" BIGINT,
    "actual_cost_kobo" BIGINT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "estimated_arrival" TIMESTAMP(3),
    "picked_up_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supplier_profiles (using snake_case: is_verified)
CREATE TABLE IF NOT EXISTS "supplier_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_address" TEXT NOT NULL,
    "cac_number" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supplier_products (using snake_case: is_active)
CREATE TABLE IF NOT EXISTS "supplier_products" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "wholesale_price_kobo" BIGINT NOT NULL,
    "min_order_qty" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: whatsapp_buyer_links
CREATE TABLE IF NOT EXISTS "whatsapp_buyer_links" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "buyer_id" UUID NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "whatsapp_buyer_links_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- CreateIndex
-- =============================================================================
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");
CREATE UNIQUE INDEX IF NOT EXISTS "bnpl_waitlists_user_id_key" ON "bnpl_waitlists"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "delivery_bookings_order_id_key" ON "delivery_bookings"("order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "supplier_profiles_user_id_key" ON "supplier_profiles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_buyer_links_phone_key" ON "whatsapp_buyer_links"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_buyer_links_buyer_id_key" ON "whatsapp_buyer_links"("buyer_id");

-- =============================================================================
-- AddForeignKey
-- =============================================================================
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewed_by_fkey" 
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID; -- Use NOT VALID to avoid re-checking existing rows; validate separately

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bnpl_waitlists" ADD CONSTRAINT "bnpl_waitlists_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_bookings" ADD CONSTRAINT "delivery_bookings_order_id_fkey" 
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "supplier_profiles" ADD CONSTRAINT "supplier_profiles_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_fkey" 
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "whatsapp_buyer_links" ADD CONSTRAINT "whatsapp_buyer_links_buyer_id_fkey" 
  FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FK for orders → supplier_profiles and orders → supplier_products (with NOT VALID to avoid full scan)
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_fkey"
  FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;

ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_product_id_fkey"
  FOREIGN KEY ("supplier_product_id") REFERENCES "supplier_products"("id") ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;

-- Validate the deferred constraints when ready (safe to run after row checks)
-- ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_supplier_id_fkey";
-- ALTER TABLE "orders" VALIDATE CONSTRAINT "orders_supplier_product_id_fkey";
-- ALTER TABLE "verification_requests" VALIDATE CONSTRAINT "verification_requests_reviewed_by_fkey";
