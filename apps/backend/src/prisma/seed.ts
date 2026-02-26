import { PrismaClient } from "./generated-client";
import * as bcrypt from "bcrypt";
import { UserRole } from "@hardware-os/shared";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seeding Process...");

  const DEFAULT_ADMIN_EMAIL = "admin@hardwareos.com";
  const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!DEFAULT_ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_BOOTSTRAP_PASSWORD environment variable is NOT SET.",
    );
  }

  const SALT_ROUNDS = 10;

  console.log(`🔒 Hashing master password...`);
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);

  console.log(`📦 Creating/Updating Super Admin account...`);
  await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: {}, // If it exists, leave it as is (atomic existence check)
    create: {
      email: DEFAULT_ADMIN_EMAIL,
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

  console.log(`✅ Super Admin created successfully!`);
  console.log(`📧 Email: ${DEFAULT_ADMIN_EMAIL}`);
  console.log(
    `🔑 Password: [HIDDEN] (Use ADMIN_BOOTSTRAP_PASSWORD environment variable)`,
  );
  console.log(
    `Important: Remember to change your password immediately upon logging in.`,
  );
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
