-- CreateEnum
CREATE TYPE "VerificationTier" AS ENUM ('UNVERIFIED', 'BASIC', 'VERIFIED', 'TRUSTED', 'TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ESCROW', 'DIRECT');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'REPAYING', 'COMPLETED', 'DEFAULTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PREPARING';
ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT';

-- AlterTable
ALTER TABLE "merchant_profiles" ADD COLUMN     "verification_tier" "VerificationTier" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'ESCROW';

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "government_id_url" TEXT,
    "cac_cert_url" TEXT,
    "id_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_tracking" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_applications" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "requested_amount_kobo" BIGINT NOT NULL,
    "tenure" INTEGER NOT NULL,
    "status" "CreditStatus" NOT NULL DEFAULT 'PENDING',
    "partner_ref" TEXT,
    "approved_amount_kobo" BIGINT,
    "interest_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_requests_merchant_id_idx" ON "verification_requests"("merchant_id");

-- CreateIndex
CREATE INDEX "order_tracking_order_id_idx" ON "order_tracking"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_applications_order_id_key" ON "credit_applications"("order_id");

-- CreateIndex
CREATE INDEX "credit_applications_buyer_id_idx" ON "credit_applications"("buyer_id");

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_tracking" ADD CONSTRAINT "order_tracking_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
