import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ordersWithQuotes = await prisma.order.count({
    where: {
      quoteId: {
        not: null,
      },
    },
  });

  console.log(`[CHECK] Total orders with quoteId: ${ordersWithQuotes}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
