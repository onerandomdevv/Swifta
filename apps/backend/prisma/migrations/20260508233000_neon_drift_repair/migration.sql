/*
  Neon drift repair.

  This migration is intentionally non-destructive. The live Neon schema has
  migrations marked as applied while several later schema changes are absent.
  Add only the columns, tables, indexes, foreign keys, and enum values required
  by the current Prisma schema. Keep legacy RFQ/quote tables and columns intact.
*/

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceType') THEN
    CREATE TYPE "PriceType" AS ENUM ('RETAIL', 'WHOLESALE');
  END IF;
END $$;

ALTER TYPE "OrderDisputeStatus" ADD VALUE IF NOT EXISTS 'RESOLVED_BUYER';
ALTER TYPE "OrderDisputeStatus" ADD VALUE IF NOT EXISTS 'RESOLVED_MERCHANT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "VerificationTier" ADD VALUE IF NOT EXISTS 'TIER_1';
ALTER TYPE "VerificationTier" ADD VALUE IF NOT EXISTS 'TIER_2';
ALTER TYPE "VerificationTier" ADD VALUE IF NOT EXISTS 'TIER_3';

-- Align existing rows with the current application tier names. The old enum
-- labels are left in the database type for now to avoid a risky enum rebuild.
UPDATE "merchant_profiles"
SET "verification_tier" = CASE
  WHEN "verification_tier"::text = 'BASIC' THEN 'TIER_1'::"VerificationTier"
  WHEN "verification_tier"::text = 'VERIFIED' THEN 'TIER_2'::"VerificationTier"
  WHEN "verification_tier"::text = 'TRUSTED' THEN 'TIER_3'::"VerificationTier"
  ELSE "verification_tier"
END
WHERE "verification_tier"::text IN ('BASIC', 'VERIFIED', 'TRUSTED');

-- ---------------------------------------------------------------------------
-- Existing tables: additive repairs
-- ---------------------------------------------------------------------------
ALTER TABLE "buyer_profiles"
  ADD COLUMN IF NOT EXISTS "dva_account_name" TEXT,
  ADD COLUMN IF NOT EXISTS "dva_account_number" TEXT,
  ADD COLUMN IF NOT EXISTS "dva_active" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "dva_bank_name" TEXT,
  ADD COLUMN IF NOT EXISTS "dva_bank_slug" TEXT,
  ADD COLUMN IF NOT EXISTS "paystack_customer_code" TEXT,
  ADD COLUMN IF NOT EXISTS "paystack_customer_id" TEXT,
  ALTER COLUMN "buyer_type" SET DEFAULT 'CONSUMER';

ALTER TABLE "cart_items"
  ADD COLUMN IF NOT EXISTS "price_type" "PriceType" NOT NULL DEFAULT 'RETAIL';

ALTER TABLE "merchant_profiles"
  ADD COLUMN IF NOT EXISTS "address_verified_via" TEXT,
  ADD COLUMN IF NOT EXISTS "cac_verified_via" TEXT,
  ADD COLUMN IF NOT EXISTS "cover_image" TEXT,
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "guarantor_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "last_slug_change_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nin_number" TEXT,
  ADD COLUMN IF NOT EXISTS "nin_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nin_verified_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nin_verified_via" TEXT,
  ADD COLUMN IF NOT EXISTS "notification_preferences" JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "profile_image" TEXT,
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "social_links" JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "tier_upgraded_at" TIMESTAMP(3);

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "delivery_details" JSONB,
  ADD COLUMN IF NOT EXISTS "dispatched_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "items" JSONB,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "is_seeded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "min_order_quantity_consumer" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "processing_days" INTEGER,
  ADD COLUMN IF NOT EXISTS "product_code" TEXT,
  ADD COLUMN IF NOT EXISTS "weight_kg" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "wholesale_discount_percent" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "wholesale_price_kobo" BIGINT;

ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "image_url" TEXT;

ALTER TABLE "verification_requests"
  ADD COLUMN IF NOT EXISTS "nin_number" TEXT,
  ADD COLUMN IF NOT EXISTS "target_tier" "VerificationTier" NOT NULL DEFAULT 'TIER_2';

-- ---------------------------------------------------------------------------
-- New tables expected by the current schema
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "saved_products" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "merchant_slug_history" (
  "id" UUID NOT NULL,
  "merchant_profile_id" UUID NOT NULL,
  "old_slug" TEXT NOT NULL,
  "new_slug" TEXT NOT NULL,
  "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "merchant_slug_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "whatsapp_supplier_links" (
  "id" UUID NOT NULL,
  "phone" TEXT NOT NULL,
  "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "supplier_id" UUID NOT NULL,
  CONSTRAINT "whatsapp_supplier_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "follows" (
  "id" UUID NOT NULL,
  "follower_id" UUID NOT NULL,
  "merchant_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "merchant_waitlists" (
  "id" UUID NOT NULL,
  "business_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "merchant_waitlists_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS "cart_items_buyer_id_product_id_key";
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_buyer_id_product_id_price_type_key"
  ON "cart_items"("buyer_id", "product_id", "price_type");

CREATE INDEX IF NOT EXISTS "merchant_profiles_slug_idx"
  ON "merchant_profiles"("slug");

CREATE INDEX IF NOT EXISTS "orders_merchant_id_status_idx"
  ON "orders"("merchant_id", "status");

CREATE INDEX IF NOT EXISTS "orders_buyer_id_status_idx"
  ON "orders"("buyer_id", "status");

CREATE INDEX IF NOT EXISTS "products_product_code_idx"
  ON "products"("product_code");

CREATE INDEX IF NOT EXISTS "products_category_id_idx"
  ON "products"("category_id");

CREATE INDEX IF NOT EXISTS "products_is_active_created_at_idx"
  ON "products"("is_active", "created_at");

CREATE INDEX IF NOT EXISTS "saved_products_user_id_idx"
  ON "saved_products"("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "saved_products_user_id_product_id_key"
  ON "saved_products"("user_id", "product_id");

CREATE UNIQUE INDEX IF NOT EXISTS "merchant_slug_history_old_slug_key"
  ON "merchant_slug_history"("old_slug");

CREATE INDEX IF NOT EXISTS "merchant_slug_history_merchant_profile_id_idx"
  ON "merchant_slug_history"("merchant_profile_id");

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_supplier_links_phone_key"
  ON "whatsapp_supplier_links"("phone");

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_supplier_links_supplier_id_key"
  ON "whatsapp_supplier_links"("supplier_id");

CREATE INDEX IF NOT EXISTS "follows_follower_id_idx"
  ON "follows"("follower_id");

CREATE INDEX IF NOT EXISTS "follows_merchant_id_idx"
  ON "follows"("merchant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "follows_follower_id_merchant_id_key"
  ON "follows"("follower_id", "merchant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "merchant_waitlists_email_key"
  ON "merchant_waitlists"("email");

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saved_products_product_id_fkey'
  ) THEN
    ALTER TABLE "saved_products"
      ADD CONSTRAINT "saved_products_product_id_fkey"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saved_products_user_id_fkey'
  ) THEN
    ALTER TABLE "saved_products"
      ADD CONSTRAINT "saved_products_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'merchant_slug_history_merchant_profile_id_fkey'
  ) THEN
    ALTER TABLE "merchant_slug_history"
      ADD CONSTRAINT "merchant_slug_history_merchant_profile_id_fkey"
      FOREIGN KEY ("merchant_profile_id") REFERENCES "merchant_profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_supplier_links_supplier_id_fkey'
  ) THEN
    ALTER TABLE "whatsapp_supplier_links"
      ADD CONSTRAINT "whatsapp_supplier_links_supplier_id_fkey"
      FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'follows_follower_id_fkey'
  ) THEN
    ALTER TABLE "follows"
      ADD CONSTRAINT "follows_follower_id_fkey"
      FOREIGN KEY ("follower_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'follows_merchant_id_fkey'
  ) THEN
    ALTER TABLE "follows"
      ADD CONSTRAINT "follows_merchant_id_fkey"
      FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
