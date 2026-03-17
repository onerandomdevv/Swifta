-- AlterTable
ALTER TABLE "orders" ADD COLUMN "platform_fee_kobo" BIGINT,
ADD COLUMN "platform_fee_percent" DOUBLE PRECISION;
