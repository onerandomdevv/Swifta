import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { UserRole } from "@hardware-os/shared";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seeding Process...");

  const LEGACY_ADMIN_EMAIL = "admin@swifttrade.ng";
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
  } else {
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
  }

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

  // 3. Seed Sample Building Materials Catalogue
  console.log(`\n🏪 Seeding Sample Merchant & Products...`);
  const DEMO_MERCHANT_EMAIL = "merchant@demo.swifttrade.ng";
  let merchantUser = await prisma.user.findFirst({ where: { email: DEMO_MERCHANT_EMAIL } });
  
  if (!merchantUser) {
    merchantUser = await prisma.user.create({
      data: {
        email: DEMO_MERCHANT_EMAIL,
        phone: "+2348000000001",
        firstName: "Demo",
        lastName: "Merchant",
        passwordHash: await bcrypt.hash("Password123!", 10),
        role: UserRole.MERCHANT,
        merchantProfile: {
          create: {
            businessName: "Demo Building Materials Ltd",
            businessAddress: "123 Trade Way, Lagos",
            verificationTier: "VERIFIED",
          }
        }
      }
    });
    console.log(`✨ Demo merchant created: ${DEMO_MERCHANT_EMAIL}`);
  }

  const merchantProfile = await prisma.merchantProfile.findFirst({ where: { userId: merchantUser.id } });
  
  if (merchantProfile) {
    // Check if products exist for this merchant
    const productCount = await prisma.product.count({ where: { merchantId: merchantProfile.id } });
    
    if (productCount === 0) {
      console.log(`📦 Creating sample building materials for Demo Merchant...`);
      
      const sampleProducts = [
        {
          name: "Dangote Cement 3X (50kg Bag)",
          description: "High quality Portland limestone cement suitable for all general purpose construction projects.",
          unit: "Bag",
          pricePerUnitKobo: 950000n, // 9,500 NGN
          categoryTag: "Cement",
          minOrderQuantity: 50,
        },
        {
          name: "12mm Iron Rods (TMT)",
          description: "High-yield Thermo Mechanically Treated (TMT) steel reinforcement bars for structural concrete.",
          unit: "Length",
          pricePerUnitKobo: 1250000n,
          categoryTag: "Iron Rods & Steel",
          minOrderQuantity: 20,
        },
        {
          name: "9-inch Hollow Concrete Block",
          description: "Standard 9-inch load-bearing hollow sandcrete blocks, properly cured.",
          unit: "Piece",
          pricePerUnitKobo: 55000n, // 550 NGN
          categoryTag: "Blocks",
          minOrderQuantity: 500,
        },
        {
          name: "Dulux Emulsion Paint (20 Litres)",
          description: "Premium quality emulsion paint for interior and exterior walls. Brilliant White color.",
          unit: "Bucket",
          pricePerUnitKobo: 4500000n, // 45,000 NGN
          categoryTag: "Paints & Coatings",
          minOrderQuantity: 5,
        },
        {
          name: "0.45mm Aluminum Roofing Sheet (Long Span)",
          description: "Durable corrugated aluminum roofing sheets, available in various colors.",
          unit: "Meter",
          pricePerUnitKobo: 420000n, // 4,200 NGN
          categoryTag: "Roofing Sheets",
          minOrderQuantity: 100,
        },
        {
          name: "60x60cm Vitrified Floor Tiles",
          description: "High gloss, anti-slip vitrified ceramic tiles for living rooms and offices. (1 carton = 1.44 sqm)",
          unit: "Carton",
          pricePerUnitKobo: 750000n, // 7,500 NGN
          categoryTag: "Tiles (Floor & Wall)",
          minOrderQuantity: 20,
        },
      ];

      let seededCount = 0;
      for (const prod of sampleProducts) {
        const product = await prisma.product.create({
          data: {
            merchantId: merchantProfile.id,
            ...prod,
          }
        });
        
        // Add some stock
        await prisma.productStockCache.create({
          data: {
            productId: product.id,
            stock: 1000,
          }
        });
        seededCount++;
      }
      console.log(`✅ Seeded ${seededCount} sample products for the Demo Merchant.`);
    } else {
      console.log(`✅ Demo merchant already has ${productCount} products.`);
    }
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
