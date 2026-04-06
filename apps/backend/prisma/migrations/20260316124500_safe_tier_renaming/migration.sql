-- 1. Ensure new enum values already exist on the Postgres type VerificationTier
-- (Added via history fix in 20260306142423_v3_scale_and_trust)

-- 2. Add temporary column verification_tier_new on merchant_profiles table
ALTER TABLE "merchant_profiles" ADD COLUMN IF NOT EXISTS "verification_tier_new" "VerificationTier" DEFAULT 'UNVERIFIED';

-- 3. Backfill verification_tier_new from verification_tier using CASE mapping
UPDATE "merchant_profiles" SET "verification_tier_new" = CASE
  WHEN "verification_tier"::text = 'BASIC'    THEN 'TIER_1'::"VerificationTier"
  WHEN "verification_tier"::text = 'VERIFIED' THEN 'TIER_2'::"VerificationTier"
  WHEN "verification_tier"::text = 'TRUSTED'  THEN 'TIER_3'::"VerificationTier"
  ELSE "verification_tier" -- Handles UNVERIFIED and any already migrated cases
END;

-- 4. Drop the old verification_tier, rename new, and restore constraints
ALTER TABLE "merchant_profiles" DROP COLUMN "verification_tier";
ALTER TABLE "merchant_profiles" RENAME COLUMN "verification_tier_new" TO "verification_tier";
ALTER TABLE "merchant_profiles" ALTER COLUMN "verification_tier" SET NOT NULL;
ALTER TABLE "merchant_profiles" ALTER COLUMN "verification_tier" SET DEFAULT 'UNVERIFIED';
