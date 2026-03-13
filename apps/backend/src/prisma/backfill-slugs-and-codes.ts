import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
  console.log("🔄 Starting backfill for slugs and product codes...");

  // 1. Merchant Slugs
  const merchants = await prisma.merchantProfile.findMany({
    where: { slug: null },
  });

  console.log(`👤 Found ${merchants.length} merchants needing slugs.`);
  for (const merchant of merchants) {
    const baseSlug = merchant.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const slugSeed = baseSlug || "merchant";
    let finalSlug = `${slugSeed}-${merchant.userId.slice(0, 5)}`;
    let isUnique = false;
    let counter = 0;

    while (!isUnique) {
      const existing = await prisma.merchantProfile.findFirst({
        where: { slug: finalSlug },
      });

      if (!existing) {
        isUnique = true;
      } else {
        counter++;
        finalSlug = `${slugSeed}-${merchant.userId.slice(0, 5)}-${counter}`;
      }
    }

    await prisma.merchantProfile.update({
      where: { id: merchant.id },
      data: { slug: finalSlug },
    });
    console.log(`✅ Assigned slug: ${finalSlug} to ${merchant.businessName}`);
  }

  // 2. Product Codes
  const products = await prisma.product.findMany({
    where: { productCode: null },
  });

  console.log(`📦 Found ${products.length} products needing product codes.`);
  for (const product of products) {
    const baseCode = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const codeSeed = baseCode || "product";
    let finalCode = `${codeSeed}-${product.id.slice(0, 5)}`;
    let isUnique = false;
    let counter = 0;

    while (!isUnique) {
      const existing = await prisma.product.findFirst({
        where: { productCode: finalCode },
      });

      if (!existing) {
        isUnique = true;
      } else {
        counter++;
        finalCode = `${codeSeed}-${product.id.slice(0, 5)}-${counter}`;
      }
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { productCode: finalCode },
    });
    console.log(`✅ Assigned code: ${finalCode} to ${product.name}`);
  }

  console.log("✨ Backfill complete!");
}

backfill()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
