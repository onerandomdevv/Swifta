-- Make ledger writes retry-safe. Existing rows may keep NULL keys; all new
-- writes should provide a deterministic idempotency key.

ALTER TABLE "ledger_entries"
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

UPDATE "ledger_entries"
SET "idempotency_key" = 'legacy:' || "id"::text
WHERE "idempotency_key" IS NULL;

ALTER TABLE "ledger_entries"
  ALTER COLUMN "idempotency_key" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ledger_entries_idempotency_key_key"
  ON "ledger_entries"("idempotency_key");
