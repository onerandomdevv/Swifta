const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding root Admin user...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@hardwareos.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "SecureAdmin123!";
  const adminName = process.env.ADMIN_NAME || "Super Administrator";

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`[!] Admin user already exists with email: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Generate Admin Record
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      phone: "+2340000000000", // Dummy strictly formatted Nigerian number
      fullName: adminName,
      passwordHash: hashedPassword,
      role: "ADMIN",
      emailVerified: true,
      adminProfile: {
        create: {
          department: "Executive",
          accessLevel: "SUPER_ADMIN",
        },
      },
    },
    include: {
      adminProfile: true,
    },
  });

  console.log(`[*] Successfully seeded root Admin user: ${admin.email}`);
  console.log(`[*] Default Password: ${adminPassword}`);
  console.log("---");
  console.log("PLEASE CHANGE YOUR PASSWORD IMMEDIATELY UPON LOGIN");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
