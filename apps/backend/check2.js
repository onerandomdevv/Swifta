const { PrismaClient } = require('@prisma/client');

async function check() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });

  try {
    const count = await prisma.order.count({ where: { quoteId: { not: null } } });
    console.log("===RESULT=== COUNT:", count);
    process.exitCode = 0;
  } catch (error) {
    console.error("Check failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

check();

