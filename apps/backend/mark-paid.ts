import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orderId = '5c03d69b-3625-405e-babc-77fd059d8454';
  const paymentId = '6c7fab86-79b5-44d5-8967-25ae61480bc8';

  try {
    // Mark payment as SUCCESS
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS', verifiedAt: new Date() }
    });

    // Mark order as PAID
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' }
    });

    console.log('Successfully marked order as PAID and payment as SUCCESS locally.');
  } catch (err) {
    console.error('Failed to update: ', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
