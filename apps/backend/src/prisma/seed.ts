import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { UserRole } from "@swifta/shared";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Clean Database Seeding Process...");

  const LEGACY_ADMIN_EMAIL = "admin@swifta.store";
  const BOOTSTRAP_ADMIN_EMAIL =
    process.env.ADMIN_BOOTSTRAP_EMAIL || LEGACY_ADMIN_EMAIL;
  const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  // 1. Admin Bootstrap
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (!existingAdmin) {
    if (!DEFAULT_ADMIN_PASSWORD) {
      console.warn(
        "⚠️ ADMIN_BOOTSTRAP_PASSWORD not set. Skipping admin creation.",
      );
    } else {
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: BOOTSTRAP_ADMIN_EMAIL }
      });

      if (existingUser) {
        console.log(`🔄 Promoting existing user to Admin: ${BOOTSTRAP_ADMIN_EMAIL}`);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.SUPER_ADMIN,
            adminProfile: {
              upsert: {
                create: { approvalStatus: "APPROVED" },
                update: { approvalStatus: "APPROVED" }
              }
            }
          }
        });
      } else {
        await prisma.user.create({
          data: {
            email: BOOTSTRAP_ADMIN_EMAIL,
            phone: "+234000000000",
            firstName: "Swifta",
            lastName: "Admin",
            passwordHash: passwordHash,
            role: UserRole.SUPER_ADMIN,
            adminProfile: { create: { approvalStatus: "APPROVED" } },
          },
        });
        console.log(`🚀 Created Admin: ${BOOTSTRAP_ADMIN_EMAIL}`);
      }
    }
  }

  // 2. Marketplace Categories (Structural)
  console.log(`\n📂 Syncing Product Categories...`);
  const categoriesToSeed = [
    { name: "Electronics", slug: "electronics", icon: "devices" },
    { name: "Fashion", slug: "fashion", icon: "checkroom" },
    { name: "Home & Kitchen", slug: "home-kitchen", icon: "kitchen" },
    { name: "Health & Beauty", slug: "health-beauty", icon: "face" },
    { name: "Auto Parts", slug: "auto-parts", icon: "directions_car" },
    { name: "Agriculture", slug: "agriculture", icon: "agriculture" },
    {
      name: "Building Materials",
      slug: "building-materials",
      icon: "hardware",
    },
    {
      name: "Food & Groceries",
      slug: "food-groceries",
      icon: "local_grocery_store",
    },
    { name: "Other", slug: "other", icon: "category" },
  ];

  for (let i = 0; i < categoriesToSeed.length; i++) {
    const cat = categoriesToSeed[i];
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, sortOrder: i },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, sortOrder: i },
    });
  }

  // 3. COMPLETE PURGE OF MOCKED/DEMO DATA
  console.log(`\n🧹 Purging all demo and fake data...`);

  // Get IDs of all seeded products
  const seededProducts = await prisma.product.findMany({
    where: { isSeeded: true },
    select: { id: true }
  });
  const seededProductIds = seededProducts.map(p => p.id);

  // Delete mock associations for seeded products only
  await prisma.productAssociation.deleteMany({
    where: {
      OR: [
        { productId: { in: seededProductIds } },
        { isDemo: true } as any // Handle if schema has isDemo, if not OR handles IDs
      ]
    }
  });

  // Delete all seeded products and their caches
  await prisma.productStockCache.deleteMany({
    where: { product: { isSeeded: true } },
  });
  await prisma.product.deleteMany({ where: { isSeeded: true } });

  // Optional: Remove the demo merchant user and ALL their data if they exist
  const DEMO_MERCHANT_EMAIL = "merchant@demo.swifta.store";
  const demoMerchant = await prisma.user.findUnique({
    where: { email: DEMO_MERCHANT_EMAIL },
    include: { merchantProfile: true }
  });

  if (demoMerchant && demoMerchant.merchantProfile) {
    const merchantId = demoMerchant.merchantProfile.id;
    console.log(`🗑️ Removing Demo Merchant (${DEMO_MERCHANT_EMAIL}) and their associated data...`);
    
    // Reverse dependency deletion order
    await prisma.inventoryEvent.deleteMany({ where: { merchantId } });
    await prisma.order.deleteMany({ where: { merchantId } });
    await prisma.creditApplication.deleteMany({ where: { merchantId } });
    await prisma.payoutRequest.deleteMany({ where: { merchantId } });
    await prisma.payout.deleteMany({ where: { merchantId } });
    // Add any other dependent models here
    
    await prisma.merchantProfile.deleteMany({
      where: { userId: demoMerchant.id },
    });
    await prisma.user.delete({ where: { id: demoMerchant.id } });
  }

  console.log(`✅ Database is now clean and production-ready.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ PURGE FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
