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
    where: {
      role: UserRole.SUPER_ADMIN,
    },
  });

  if (existingAdmin) {
    console.log(`✅ Super Admin already exists: ${existingAdmin.email}`);
    return;
  }

  const SALT_ROUNDS = 10;

  console.log(`🔒 Hashing master password...`);
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);

  console.log(`🚀 Checking for existing user with bootstrap email...`);
  const existingUser = await prisma.user.findFirst({
    where: { email: BOOTSTRAP_ADMIN_EMAIL },
  });

  if (existingUser) {
    if (existingUser.role !== UserRole.SUPER_ADMIN) {
      console.log(
        `Updating existing user ${BOOTSTRAP_ADMIN_EMAIL} to SUPER_ADMIN...`,
      );
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: UserRole.SUPER_ADMIN,
          passwordHash: passwordHash,
          adminProfile: {
            upsert: {
              create: { approvalStatus: "APPROVED" },
              update: { approvalStatus: "APPROVED" },
            },
          },
        },
      });
      console.log(`✨ Existing user upgraded to Super Admin successfully!`);
    } else {
      console.log(`✅ User ${BOOTSTRAP_ADMIN_EMAIL} is already a Super Admin.`);
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
  }

  console.log(`📧 Email: ${BOOTSTRAP_ADMIN_EMAIL}`);
  console.log(
    `🔑 Password: [HIDDEN] (Use ADMIN_BOOTSTRAP_PASSWORD environment variable)`,
  );
  console.log(
    `Important: Remember to change your password immediately upon logging in.`,
  );

  // 2. Seed Product Associations (Cross-Selling)
  console.log(`\n📦 Seeding Product Associations...`);
  const associations = [
    {
      a: "cement",
      b: "binding_wire",
      s: 0.9,
      t: "Cement buyers usually also need binding wire",
    },
    {
      a: "cement",
      b: "sand",
      s: 0.8,
      t: "Cement is typically used with sharp sand",
    },
    {
      a: "cement",
      b: "head_pan",
      s: 0.6,
      t: "Construction sites using cement often need head pans",
    },
    {
      a: "iron_rod",
      b: "binding_wire",
      s: 0.95,
      t: "Iron rods require binding wire for reinforcement",
    },
    {
      a: "iron_rod",
      b: "cement",
      s: 0.7,
      t: "Reinforcement projects usually need cement too",
    },
    {
      a: "blocks",
      b: "cement",
      s: 0.9,
      t: "Blocks are laid with cement mortar",
    },
    {
      a: "blocks",
      b: "sand",
      s: 0.85,
      t: "Block laying requires sand for mortar mix",
    },
    {
      a: "roofing_sheets",
      b: "roofing_nails",
      s: 0.95,
      t: "Roofing sheets need roofing nails for installation",
    },
    {
      a: "roofing_sheets",
      b: "wood",
      s: 0.7,
      t: "Roofing typically requires timber purlins",
    },
    {
      a: "pop_cement",
      b: "sandpaper",
      s: 0.8,
      t: "POP finishing is typically sanded smooth",
    },
    {
      a: "pop_cement",
      b: "paint",
      s: 0.6,
      t: "Walls finished with POP are usually painted",
    },
    {
      a: "tiles",
      b: "tile_adhesive",
      s: 0.95,
      t: "Tiles require adhesive for installation",
    },
    {
      a: "tiles",
      b: "tile_spacers",
      s: 0.8,
      t: "Tile installation uses spacers for even gaps",
    },
    { a: "tiles", b: "grout", s: 0.85, t: "Tiles need grout to fill joints" },
    {
      a: "paint",
      b: "brushes_rollers",
      s: 0.9,
      t: "Paint application requires brushes or rollers",
    },
    {
      a: "paint",
      b: "masking_tape",
      s: 0.6,
      t: "Painters use masking tape for clean edges",
    },
    {
      a: "granite",
      b: "cement",
      s: 0.7,
      t: "Granite is mixed with cement for concrete",
    },
    {
      a: "granite",
      b: "sand",
      s: 0.7,
      t: "Concrete mix uses granite with sand",
    },
    { a: "wood", b: "nails", s: 0.9, t: "Timber work requires nails" },
    {
      a: "wood",
      b: "screws",
      s: 0.7,
      t: "Woodwork often uses screws for joining",
    },
  ];

  for (const assoc of associations) {
    await prisma.productAssociation.upsert({
      where: {
        productCategoryA_productCategoryB: {
          productCategoryA: assoc.a,
          productCategoryB: assoc.b,
        },
      },
      update: { strength: assoc.s, promptText: assoc.t },
      create: {
        productCategoryA: assoc.a,
        productCategoryB: assoc.b,
        strength: assoc.s,
        promptText: assoc.t,
      },
    });
  }
  console.log(`✅ ${associations.length} product associations seeded.`);
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
