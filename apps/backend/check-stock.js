const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStock() {
  const products = await prisma.product.findMany({
    include: { productStockCache: true },
    take: 5
  });
  console.log("Products:");
  products.forEach(p => {
    console.log(`- ${p.name} (ID: ${p.id})`);
    console.log(`  Stock: ${p.productStockCache?.stock ?? 'NO CACHE'}`);
  });
}

checkStock().catch(console.error).finally(() => prisma.$disconnect());
