-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."whatsapp_links" DROP CONSTRAINT "whatsapp_links_merchant_id_fkey";

-- DropIndex
DROP INDEX "public"."whatsapp_links_merchant_id_key";

-- 1. Create Categories Table Early
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- 2. Backfill Categories from Existing Products
-- Insert unique category tags as categories if they don't exist
INSERT INTO "categories" ("id", "name", "slug")
SELECT
    gen_random_uuid(),
    "category_tag",
    lower(trim(regexp_replace("category_tag", '[^a-zA-Z0-9]+', '-', 'g')))
FROM (SELECT DISTINCT "category_tag" FROM "products") AS unique_tags
ON CONFLICT ("slug") DO NOTHING;

-- 3. Prepare products.category_id
ALTER TABLE "products" ADD COLUMN "category_id" UUID;

-- Update products with matching category IDs
UPDATE "products" p
SET "category_id" = c."id"
FROM "categories" c
WHERE p."category_tag" = c."name";

-- If any products still have NULL category_id (shouldn't happen with above logic), 
-- you might want a default or let it fail here to catch inconsistencies.
ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;

-- 4. Prepare whatsapp_links.user_id
ALTER TABLE "whatsapp_links" ADD COLUMN "user_id" UUID;

-- Map merchant_id to user_id via merchant_profiles
UPDATE "whatsapp_links" wl
SET "user_id" = mp."user_id"
FROM "merchant_profiles" mp
WHERE wl."merchant_id" = mp."id";

-- Force NOT NULL after backfill
ALTER TABLE "whatsapp_links" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "whatsapp_links" DROP COLUMN "merchant_id";

-- 5. Continue with other Alterations
ALTER TABLE "credit_applications" ADD COLUMN     "commission_kobo" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "merchant_id" UUID,
ADD COLUMN     "partner_disbursement_ref" TEXT,
ADD COLUMN     "partner_name" TEXT NOT NULL DEFAULT 'mock';

ALTER TABLE "merchant_profiles" ADD COLUMN     "average_rating" DOUBLE PRECISION,
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "orders" ADD COLUMN     "dispute_window_ends_at" TIMESTAMP(3);

-- Create remaining tables
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_sessions" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "buyer_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT,
    "business_address" TEXT,
    "buyer_type" TEXT NOT NULL DEFAULT 'BUSINESS',
    "onboarding_step" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);

-- Indices
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "reviews_order_id_key" ON "reviews"("order_id");
CREATE UNIQUE INDEX "onboarding_sessions_phone_key" ON "onboarding_sessions"("phone");
CREATE UNIQUE INDEX "buyer_profiles_user_id_key" ON "buyer_profiles"("user_id");
CREATE INDEX "credit_applications_merchant_id_idx" ON "credit_applications"("merchant_id");
CREATE UNIQUE INDEX "whatsapp_links_user_id_key" ON "whatsapp_links"("user_id");

-- Foreign Keys
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "whatsapp_links" ADD CONSTRAINT "whatsapp_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyer_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

