-- The payouts table already has a full unique index on order_id from the
-- original escrow migration. Drop the later partial index to avoid redundant
-- write overhead while keeping migration history append-only.

DROP INDEX IF EXISTS "payouts_one_active_per_order_key";
