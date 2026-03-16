const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const associations = await prisma.productAssociation.findMany();
    console.log('--- Product Associations ---');
    associations.forEach(a => console.log(`${a.productCategoryA} + ${a.productCategoryB}: ${a.promptText}`));
    
    const products = await prisma.product.findMany({ where: { isSeeded: true } });
    console.log('\n--- Seeded Products ---');
    products.forEach(p => console.log(`- ${p.name} (${p.categoryTag})`));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
