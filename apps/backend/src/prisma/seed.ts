import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { UserRole } from "@hardware-os/shared";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seeding Process...");

  const LEGACY_ADMIN_EMAIL = "admin@hardware-os.com";
  const BOOTSTRAP_ADMIN_EMAIL =
    process.env.ADMIN_BOOTSTRAP_EMAIL || LEGACY_ADMIN_EMAIL;
  const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!DEFAULT_ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD environment variable is NOT SET.",
    );
  }

  // 1. Check for ANY existing super-admin to prevent duplicates in existing DBs
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (existingAdmin) {
    console.log(`✅ Super Admin already exists: ${existingAdmin.email}`);
    return;
  }

  const SALT_ROUNDS = 10;

  console.log(`🔒 Hashing master password...`);
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);

  // 2. Check if a non-admin user already has the bootstrap email
  const existingUser = await prisma.user.findUnique({
    where: { email: BOOTSTRAP_ADMIN_EMAIL },
  });

  if (existingUser) {
    if (existingUser.role !== UserRole.SUPER_ADMIN) {
      console.log(
        `⚠️ User with email ${BOOTSTRAP_ADMIN_EMAIL} exists but is not a Super Admin. Promoting to Super Admin...`,
      );
      await prisma.user.update({
        where: { email: BOOTSTRAP_ADMIN_EMAIL },
        data: { role: UserRole.SUPER_ADMIN },
      });
      console.log(`✅ Existing user promoted to Super Admin.`);
      console.log(`📧 Email: ${BOOTSTRAP_ADMIN_EMAIL}`);
    }
  } else {
    console.log(`🚀 Creating new Super Admin account...`);
    await prisma.user.create({
      data: {
        email: BOOTSTRAP_ADMIN_EMAIL,
        phone: "+234000000000",
        firstName: "HARDWARE",
        lastName: "Admin",
        passwordHash: passwordHash,
        role: UserRole.SUPER_ADMIN,
        adminProfile: {
          create: {
            approvalStatus: "APPROVED",
          },
        },
      },
    });
    console.log(`✨ Super Admin created successfully!`);
    console.log(`📧 Email: ${BOOTSTRAP_ADMIN_EMAIL}`);
    console.log(
      `🔑 Password: [HIDDEN] (Use ADMIN_BOOTSTRAP_PASSWORD environment variable)`,
    );
    console.log(
      `Important: Remember to change your password immediately upon logging in.`,
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ SEEDING FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
