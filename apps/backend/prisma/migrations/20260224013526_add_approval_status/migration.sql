-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "admin_profiles" ADD COLUMN     "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';
