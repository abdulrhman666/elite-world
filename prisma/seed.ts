import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { restoreExistingProjectData } from "../lib/admin/restore-existing-data";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to restore the catalog data.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const restored = await restoreExistingProjectData(prisma);
  process.stdout.write(
    `Restore completed: ${restored.catalogProducts} catalog products (${restored.productsCreated} created), ${restored.categories} catalog categories, ${restored.contentPagesCreated} content pages, ${restored.blogPostsCreated} blog posts, ${restored.siteSettingsCreated} settings records, ${restored.missingImages} missing image files.\n`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
