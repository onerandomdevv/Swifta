import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { UserRole } from "@hardware-os/shared";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seeding Process...");

  // 1. Check if ANY Super Admin exists
  const adminCount = await prisma.user.count({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (adminCount > 0) {
    console.log(
      "✅ Super Admin already exists in the database. Skipping creation.",
    );
    return;
  }

  // 2. We have a fresh database. Generate the master admin account securely.
  console.log(
    "⚠️ No Super Admin found! Generating default administrator account...",
  );

  const DEFAULT_ADMIN_EMAIL = "admin@hardware-os.com";
  const DEFAULT_ADMIN_PASSWORD = "Admin@123";
  const SALT_ROUNDS = 10;

  console.log(`🔒 Hashing master password...`);
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);

  const newAdmin = await prisma.user.create({
    data: {
      email: DEFAULT_ADMIN_EMAIL,
      phone: "+234000000000", // Placeholder
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
  console.log(`🔑 Password: ${DEFAULT_ADMIN_PASSWORD}`);
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
