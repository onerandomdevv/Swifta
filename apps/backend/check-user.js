const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUser() {
  const email = "abdulkareemalameen75@gmail.com";
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`User ${email} does NOT exist in DB.`);
  } else {
    console.log(`User exists. emailVerified: ${user.emailVerified}`);
    if (user.emailVerified) {
      console.log(`Resetting emailVerified to false so we can test OTP...`);
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: false },
      });
      console.log(`Reset complete.`);
    }

    // reset rate limits in redis
    const Redis = require("ioredis");
    const redis = new Redis("redis://localhost:6379");
    await redis.del(`email_otp_count:${email}`);
    console.log(`Redis rate limits cleared for ${email}`);

    process.exit(0);
  }
}

checkUser();
