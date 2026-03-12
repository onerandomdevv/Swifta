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
    
    // Fallback if businessName is empty or contains no valid chars
    const slugSeed = baseSlug || "merchant";
    const finalSlug = `${slugSeed}-${merchant.userId.slice(0, 5)}`;
    
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
    const finalCode = `${codeSeed}-${product.id.slice(0, 5)}`;

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
