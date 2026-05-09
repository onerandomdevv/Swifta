-- Make ledger writes retry-safe. Existing rows may keep NULL keys; all new
-- writes should provide a deterministic idempotency key.

ALTER TABLE "ledger_entries"
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ledger_entries_idempotency_key_key"
  ON "ledger_entries"("idempotency_key");
