const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function wipe() {
  await prisma.quote.deleteMany({});
  await prisma.rfq.deleteMany({});
  console.log("Successfully wiped Quotes and RFQs for the B2C clean slate.");
}
wipe()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
