import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  console.log(`\n📂 Syncing Product Categories Safely...`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const categoriesToSeed = [
      { name: "Electronics", slug: "electronics", icon: "devices" },
      { name: "Fashion", slug: "fashion", icon: "checkroom" },
      { name: "Home & Kitchen", slug: "home-kitchen", icon: "kitchen" },
      { name: "Health & Beauty", slug: "health-beauty", icon: "face" },
      { name: "Auto Parts", slug: "auto-parts", icon: "directions_car" },
      { name: "Agriculture", slug: "agriculture", icon: "agriculture" },
      { name: "Office & Stationery", slug: "office-stationery", icon: "print" },
      { name: "Food & Groceries", slug: "food-groceries", icon: "local_grocery_store" },
      { name: "Books & Media", slug: "books-media", icon: "menu_book" },
      { name: "Other", slug: "other", icon: "category" },
    ];

    for (let i = 0; i < categoriesToSeed.length; i++) {
        const cat = categoriesToSeed[i];
        await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, icon: cat.icon, sortOrder: i, isActive: true },
        create: { name: cat.name, slug: cat.slug, icon: cat.icon, sortOrder: i, isActive: true },
        });
    }

    // Now, let's DEACTIVATE any legacy/test categories (like Phones & Gadgets or Baby & Kids) that are not in our official top 10 list
    // This ensures only our clean 10 categories show up in the dropdown
    const validSlugs = categoriesToSeed.map(c => c.slug);
    
    await prisma.category.updateMany({
        where: { slug: { notIn: validSlugs } },
        data: { isActive: false }
    });

    console.log(`✅ Categories synced successfully! Only the official 10 are now active.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .catch(async (e) => {
    console.error("❌ SYNC FAILED:", e);
    process.exit(1);
  });
