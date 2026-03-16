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

  // Delete all mock associations
  await prisma.productAssociation.deleteMany({});

  // Delete all seeded products and their caches
  await prisma.productStockCache.deleteMany({
    where: { product: { isSeeded: true } },
  });
  await prisma.product.deleteMany({ where: { isSeeded: true } });

  // Optional: Remove the demo merchant user if they exist
  const DEMO_MERCHANT_EMAIL = "merchant@demo.swifta.store";
  const demoMerchant = await prisma.user.findUnique({
    where: { email: DEMO_MERCHANT_EMAIL },
  });

  if (demoMerchant) {
    console.log(`🗑️ Removing Demo Merchant user...`);
    // Delete merchant profile first (due to relations)
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
