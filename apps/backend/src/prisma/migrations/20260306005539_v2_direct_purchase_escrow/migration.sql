/*
  Warnings:

  - You are about to drop the column `bank_account_name` on the `merchant_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `bank_account_no` on the `merchant_profiles` table. All the data in the column will be lost.
  - The `from_status` column on the `order_events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `to_status` on the `order_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `first_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SharedQuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReorderReminderStatus" AS ENUM ('PENDING', 'SENT', 'DISMISSED', 'REORDERED');

-- CreateEnum
CREATE TYPE "OrderDisputeStatus" AS ENUM ('NONE', 'PENDING', 'RESOLVED');

-- AlterEnum
ALTER TYPE "VerificationStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_quote_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."rfqs" DROP CONSTRAINT "rfqs_product_id_fkey";

-- AlterTable
ALTER TABLE "admin_profiles" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "merchant_profiles" DROP COLUMN "bank_account_name",
DROP COLUMN "bank_account_no",
ADD COLUMN     "address_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cac_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paystack_recipient_code" TEXT,
ADD COLUMN     "quote_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "response_time_total" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "settlement_account_name" TEXT,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "order_events" DROP COLUMN "from_status",
ADD COLUMN     "from_status" "OrderStatus",
DROP COLUMN "to_status",
ADD COLUMN     "to_status" "OrderStatus" NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_address" TEXT,
ADD COLUMN     "dispute_reason" TEXT,
ADD COLUMN     "dispute_status" "OrderDisputeStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "payout_status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "product_id" UUID,
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "unit_price_kobo" BIGINT,
ALTER COLUMN "quote_id" DROP NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "product_stock_cache" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "price_per_unit_kobo" BIGINT,
ADD COLUMN     "warehouse_location" TEXT,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "quotes" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "rfqs" ADD COLUMN     "unlisted_item_details" JSONB,
ALTER COLUMN "product_id" DROP NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "staff_access_tokens" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL;

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "amount_kobo" BIGINT NOT NULL,
    "platform_fee_kobo" BIGINT NOT NULL,
    "paystack_transfer_code" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "initiated_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "amount_kobo" BIGINT NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "bank_name" TEXT,
    "account_number" TEXT,
    "account_name" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_quotes" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "buyer_name" TEXT,
    "buyer_phone" TEXT,
    "buyer_email" TEXT,
    "items" JSONB NOT NULL,
    "subtotal_kobo" BIGINT NOT NULL,
    "delivery_fee_kobo" BIGINT NOT NULL DEFAULT 0,
    "total_kobo" BIGINT NOT NULL,
    "note" TEXT,
    "status" "SharedQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_associations" (
    "id" UUID NOT NULL,
    "product_category_a" TEXT NOT NULL,
    "product_category_b" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL,
    "prompt_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_reminders" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "product_category" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "original_quantity" INTEGER NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "status" "ReorderReminderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reorder_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_links" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "merchant_id" UUID NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "whatsapp_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payouts_order_id_key" ON "payouts"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_buyer_id_product_id_key" ON "cart_items"("buyer_id", "product_id");

-- CreateIndex
CREATE INDEX "payout_requests_merchant_id_idx" ON "payout_requests"("merchant_id");

-- CreateIndex
CREATE INDEX "payout_requests_status_idx" ON "payout_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "shared_quotes_slug_key" ON "shared_quotes"("slug");

-- CreateIndex
CREATE INDEX "shared_quotes_merchant_id_idx" ON "shared_quotes"("merchant_id");

-- CreateIndex
CREATE INDEX "shared_quotes_status_idx" ON "shared_quotes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "product_associations_product_category_a_product_category_b_key" ON "product_associations"("product_category_a", "product_category_b");

-- CreateIndex
CREATE INDEX "reorder_reminders_status_remind_at_idx" ON "reorder_reminders"("status", "remind_at");

-- CreateIndex
CREATE INDEX "reorder_reminders_buyer_id_idx" ON "reorder_reminders"("buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "reorder_reminders_order_id_key" ON "reorder_reminders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_links_phone_key" ON "whatsapp_links"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_links_merchant_id_key" ON "whatsapp_links"("merchant_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_quotes" ADD CONSTRAINT "shared_quotes_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_reminders" ADD CONSTRAINT "reorder_reminders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_reminders" ADD CONSTRAINT "reorder_reminders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_reminders" ADD CONSTRAINT "reorder_reminders_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_links" ADD CONSTRAINT "whatsapp_links_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
