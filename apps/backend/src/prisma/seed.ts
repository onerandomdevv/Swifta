import { PrismaClient } from '@prisma/client';
import { UserRole, VerificationStatus } from '@hardware-os/shared';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // create merchant
  const merchantUser = await prisma.user.upsert({
    where: { email: 'merchant@test.com' },
    update: {},
    create: {
      email: 'merchant@test.com',
      phone: '08012345678',
      passwordHash,
      role: UserRole.MERCHANT,
      emailVerified: true,
      merchantProfile: {
        create: {
          businessName: 'Test Merchant Business',
          verification: VerificationStatus.VERIFIED,
        }
      }
    },
  });

  // create buyer
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    update: {},
    create: {
      email: 'buyer@test.com',
      phone: '09087654321',
      passwordHash,
      role: UserRole.BUYER,
      emailVerified: true,
    },
  });

  // create products
  if (merchantUser) {
      const merchantProfile = await prisma.merchantProfile.findUnique({ where: { userId: merchantUser.id }});
      if(merchantProfile) {
        await prisma.product.createMany({
            data: [
                {
                    merchantId: merchantProfile.id,
                    name: 'Cement (Dangote) 50kg',
                    description: 'High quality cement',
                    unit: 'Bag',
                    categoryTag: 'Construction',
                    minOrderQuantity: 100
                },
                {
                    merchantId: merchantProfile.id,
                    name: 'Iron Rod 16mm',
                    description: 'TMT Iron Rod',
                    unit: 'Ton',
                    categoryTag: 'Construction',
                    minOrderQuantity: 1
                },
                {
                    merchantId: merchantProfile.id,
                    name: 'Sharp Sand',
                    description: 'Clean sharp sand',
                    unit: 'Trip',
                    categoryTag: 'Construction',
                    minOrderQuantity: 1
                }
            ]
        });
      }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
