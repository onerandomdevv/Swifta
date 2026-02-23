const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.merchantProfile.updateMany({
    data: {
      onboardingStep: 5,
      verification: 'VERIFIED'
    }
  });
  console.log(`Updated ${result.count} merchants to VERIFIED.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
