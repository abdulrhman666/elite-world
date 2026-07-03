import { Prisma, ProductAvailability, type PrismaClient } from "@prisma/client";
import { defaultContentPages } from "@/data/content-pages";
import { seedArticles } from "@/data/home";
import { importCatalogCsv } from "@/lib/catalog/csv-import";
import { getDefaultSiteSettings } from "@/lib/site-settings-defaults";

const articleSlugs = [
  "bakery-oven-buying-guide",
  "stainless-steel-grades-guide",
  "restaurant-equipment-essentials",
] as const;

function imageMimeType(imagePath: string) {
  const extension = imagePath.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "svg") return "image/svg+xml";
  return "image/unknown";
}

export async function restoreExistingProjectData(prisma: PrismaClient) {
  const { categories, products, report } = await importCatalogCsv();
  const categoryIds = new Map<string, string>();
  const brandIds = new Map<string, string>();

  for (const [sortOrder, category] of categories.entries()) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        slug: category.slug,
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        image: category.image,
        icon: category.icon,
        subcategories: category.subcategories as Prisma.InputJsonValue,
        sortOrder,
      },
      select: { id: true },
    });
    categoryIds.set(category.slug, record.id);
  }

  for (const brandName of new Set(products.map((product) => product.brand))) {
    const record = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
      select: { id: true },
    });
    brandIds.set(brandName, record.id);
  }

  let productsCreated = 0;
  for (const [sortOrder, product] of products.entries()) {
    const [bySlug, bySku] = await Promise.all([
      prisma.product.findUnique({
        where: { slug: product.slug },
        select: { id: true },
      }),
      prisma.product.findUnique({
        where: { sku: product.sku },
        select: { id: true },
      }),
    ]);
    if (bySlug && bySku && bySlug.id !== bySku.id) {
      throw new Error(`CATALOG_CONFLICT:${product.sku}`);
    }

    const categoryId = categoryIds.get(product.categorySlug);
    const brandId = brandIds.get(product.brand);
    if (!categoryId || !brandId) {
      throw new Error(`CATALOG_RELATION_MISSING:${product.sku}`);
    }

    let productId = bySlug?.id ?? bySku?.id;
    if (!productId) {
      const imagePaths = [
        ...new Set([product.image, ...(product.additionalImages ?? [])]),
      ];
      const record = await prisma.product.create({
        data: {
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          slug: product.slug,
          sku: product.sku,
          model: product.model,
          categoryId,
          subcategorySlug: product.subcategorySlug,
          brandId,
          origin: product.origin,
          shortDescription: product.shortDescription,
          description: product.description,
          price:
            product.price === null ? null : new Prisma.Decimal(product.price),
          stockQuantity: product.stockQuantity,
          availability:
            product.availability === "in-stock"
              ? ProductAvailability.IN_STOCK
              : ProductAvailability.ON_REQUEST,
          leadTime: product.leadTime,
          warranty: product.warranty,
          image: product.image,
          badge: product.badge ?? null,
          featured: product.featured ?? false,
          sourceCreatedAt: new Date(`${product.createdAt}T00:00:00.000Z`),
          sortOrder,
          features: product.features,
          uses: product.uses,
          technicalFile: product.technicalFile,
          specifications: {
            create: product.specifications.map((specification, index) => ({
              ...specification,
              sortOrder: index,
            })),
          },
          images: {
            create: imagePaths.map((imagePath, imageIndex) => ({
              path: imagePath,
              altText:
                imageIndex === 0
                  ? (product.imageAlt ?? `صورة المنتج ${product.nameAr}`)
                  : (product.additionalImageAlts?.[imagePath] ??
                    `صورة إضافية للمنتج ${product.nameAr}`),
              isPrimary: imageIndex === 0,
              sortOrder: imageIndex,
              mimeType: imageMimeType(imagePath),
            })),
          },
        },
        select: { id: true },
      });
      productId = record.id;
      productsCreated += 1;
    } else {
      for (const [index, specification] of product.specifications.entries()) {
        await prisma.productSpecification.upsert({
          where: {
            productId_label: { productId, label: specification.label },
          },
          update: {},
          create: { productId, ...specification, sortOrder: index },
        });
      }
      const imagePaths = [
        ...new Set([product.image, ...(product.additionalImages ?? [])]),
      ];
      for (const [imageIndex, imagePath] of imagePaths.entries()) {
        await prisma.productImage.upsert({
          where: { productId_path: { productId, path: imagePath } },
          update: {},
          create: {
            productId,
            path: imagePath,
            altText:
              imageIndex === 0
                ? (product.imageAlt ?? `صورة المنتج ${product.nameAr}`)
                : (product.additionalImageAlts?.[imagePath] ??
                  `صورة إضافية للمنتج ${product.nameAr}`),
            isPrimary: imageIndex === 0,
            sortOrder: imageIndex,
            mimeType: imageMimeType(imagePath),
          },
        });
      }
    }
  }

  let contentPagesCreated = 0;
  for (const page of Object.values(defaultContentPages)) {
    const existing = await prisma.contentPage.findUnique({
      where: { slug: page.slug },
      select: { id: true, sections: true },
    });
    if (existing) {
      const sections = JSON.stringify(existing.sections).replace(
        "علامات تجريبية بارزة",
        "علامات بارزة",
      );
      if (sections !== JSON.stringify(existing.sections)) {
        await prisma.contentPage.update({
          where: { id: existing.id },
          data: { sections: JSON.parse(sections) as Prisma.InputJsonValue },
        });
      }
      continue;
    }
    await prisma.contentPage.create({
      data: {
        slug: page.slug,
        title: page.title,
        eyebrow: page.eyebrow,
        heroTitle: page.heroTitle,
        heroDescription: page.heroDescription,
        heroImage: page.heroImage,
        sections: page.sections as Prisma.InputJsonValue,
        primaryCtaText: page.primaryCtaText,
        primaryCtaUrl: page.primaryCtaUrl,
        secondaryCtaText: page.secondaryCtaText,
        secondaryCtaUrl: page.secondaryCtaUrl,
      },
    });
    contentPagesCreated += 1;
  }

  let blogPostsCreated = 0;
  for (const [index, article] of seedArticles.entries()) {
    const slug = articleSlugs[index] ?? `restored-article-${index + 1}`;
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.blogPost.create({
      data: {
        slug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.excerpt,
        category: article.category,
        image: article.image,
        published: true,
        seoTitle: article.title,
        seoDescription: article.excerpt,
      },
    });
    blogPostsCreated += 1;
  }

  const existingSettings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { id: true },
  });
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: { id: 1, ...getDefaultSiteSettings() },
    });
  }

  return {
    catalogProducts: products.length,
    productsCreated,
    categories: categories.length,
    contentPagesCreated,
    blogPostsCreated,
    siteSettingsCreated: existingSettings ? 0 : 1,
    missingImages: report.missingImageFiles,
  };
}
