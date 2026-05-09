-- Prevent duplicate active payout processing for the same order.
-- Failed and cancelled payouts may coexist for audit/history, but only one
-- processing or completed payout should exist per order.

CREATE UNIQUE INDEX IF NOT EXISTS "payouts_one_active_per_order_key"
  ON "payouts"("order_id")
  WHERE "status" IN ('PROCESSING', 'COMPLETED');
