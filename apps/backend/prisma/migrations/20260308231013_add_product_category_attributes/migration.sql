-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "attributes" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "attributes" JSONB DEFAULT '{}';
