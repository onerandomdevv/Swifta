-- Durable money ledger entries.
-- This is additive and append-only. It does not alter existing money tables.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerEntryType') THEN
    CREATE TYPE "LedgerEntryType" AS ENUM (
      'CHECKOUT_CREATED',
      'PAYMENT_INITIALIZED',
      'PAYMENT_RECEIVED',
      'PLATFORM_FEE_ASSESSED',
      'ESCROW_HELD',
      'PAYOUT_INITIATED',
      'PAYOUT_FAILED',
      'PAYOUT_COMPLETED',
      'REFUND_INITIATED',
      'REFUND_COMPLETED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerDirection') THEN
    CREATE TYPE "LedgerDirection" AS ENUM (
      'CREDIT',
      'DEBIT',
      'HOLD',
      'RELEASE',
      'INFO'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ledger_entries" (
  "id" UUID NOT NULL,
  "entry_type" "LedgerEntryType" NOT NULL,
  "direction" "LedgerDirection" NOT NULL,
  "amount_kobo" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "order_id" UUID,
  "payment_id" UUID,
  "payout_id" UUID,
  "merchant_id" UUID,
  "user_id" UUID,
  "reference" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ledger_entries_order_id_idx" ON "ledger_entries"("order_id");
CREATE INDEX IF NOT EXISTS "ledger_entries_payment_id_idx" ON "ledger_entries"("payment_id");
CREATE INDEX IF NOT EXISTS "ledger_entries_payout_id_idx" ON "ledger_entries"("payout_id");
CREATE INDEX IF NOT EXISTS "ledger_entries_merchant_id_idx" ON "ledger_entries"("merchant_id");
CREATE INDEX IF NOT EXISTS "ledger_entries_user_id_idx" ON "ledger_entries"("user_id");
CREATE INDEX IF NOT EXISTS "ledger_entries_entry_type_idx" ON "ledger_entries"("entry_type");
CREATE INDEX IF NOT EXISTS "ledger_entries_created_at_idx" ON "ledger_entries"("created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_order_id_fkey'
  ) THEN
    ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "ledger_entries_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_payment_id_fkey'
  ) THEN
    ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "ledger_entries_payment_id_fkey"
      FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_payout_id_fkey'
  ) THEN
    ALTER TABLE "ledger_entries"
      ADD CONSTRAINT "ledger_entries_payout_id_fkey"
      FOREIGN KEY ("payout_id") REFERENCES "payouts"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
