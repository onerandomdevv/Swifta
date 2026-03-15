const { PrismaClient } = require('@prisma/client');

async function check() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.hfdngfvkgahiwmwtcyed:swiftaDevs12@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
      }
    }
  });
  const count = await prisma.order.count({ where: { quoteId: { not: null } } });
  console.log("===RESULT=== COUNT:", count);
  process.exit(0);
}
check();
