import { PrismaClient } from "@prisma/client";
import { slugify } from "../common/utils/slugify";

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting category migration...");

  // 1. Get all unique categoryTags from products
  const products = await prisma.product.findMany({
    select: { categoryTag: true },
  });

  const uniqueTags = Array.from(new Set(products.map((p) => p.categoryTag)));
  console.log(`Found ${uniqueTags.length} unique category tags.`);

  // 2. Create Category records for each tag if they don't exist
  for (const tag of uniqueTags) {
    const slug = slugify(tag);

    let category = await prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      console.log(`Creating category: ${tag} (${slug})`);
      category = await prisma.category.create({
        data: {
          name: tag,
          slug,
          isActive: true,
          sortOrder: 0,
        },
      });
    }

    // 3. Update all products with this tag to point to the new categoryId
    console.log(`Updating products with tag "${tag}"...`);
    await prisma.product.updateMany({
      where: { categoryTag: tag },
      data: { categoryId: category.id },
    });
  }

  console.log("Migration completed successfully.");
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
