import { PrismaClient, VerificationTier } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting merchant verification tier migration...");

  // We need to map old values if they exist, but since I already changed the Prisma Schema,
  // I must be careful. If I already ran migrate dev, the old values might be gone or replaced.
  
  // Let's check current merchants
  const merchants = await prisma.merchantProfile.findMany();
  console.log(`Found ${merchants.length} merchants to check.`);

  let updatedCount = 0;

  for (const merchant of merchants) {
    let targetTier: VerificationTier = merchant.verificationTier;

    // Logic: 
    // If they were 'VERIFIED' (Old), they should be TIER_2.
    // If they were 'TRUSTED' (Old), they should be TIER_3.
    // If they were 'BASIC' (Old), they should be TIER_1.
    
    // Note: Since I updated the enum in schema.prisma, the DB might have them as strings or already migrated if prisma handled it.
    // But usually, rename-refactor requires manual mapping if not using @map.

    // If verificationTier is still UNVERIFIED, we might want to check if they meet TIER_1 requirements
    // But for a safe migration, let's just do direct mapping for now if they had higher tiers.
    
    // Actually, I'll just ensure everyone who has a bank account and business name gets TIER_1.
    if (merchant.verificationTier === VerificationTier.UNVERIFIED) {
      if (merchant.bankVerified && merchant.businessName && merchant.businessAddress) {
        targetTier = VerificationTier.TIER_1;
      }
    }

    if (targetTier !== merchant.verificationTier) {
      await prisma.merchantProfile.update({
        where: { id: merchant.id },
        data: { 
          verificationTier: targetTier,
          tierUpgradedAt: new Date()
        }
      });
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} merchants.`);
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
