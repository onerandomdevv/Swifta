-- AlterTable
ALTER TABLE "users" ADD COLUMN "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN "middle_name" TEXT;
ALTER TABLE "users" ADD COLUMN "last_name" TEXT;

-- Backfill data from full_name
UPDATE "users"
SET 
    "first_name" = COALESCE(split_part("full_name", ' ', 1), ''),
    "last_name" = CASE 
        WHEN position(' ' in "full_name") > 0 
        THEN substring("full_name" from position(' ' in "full_name") + 1)
        ELSE ''
    END
WHERE "full_name" IS NOT NULL;

-- Drop the old full_name column
ALTER TABLE "users" DROP COLUMN "full_name";
