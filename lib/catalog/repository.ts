import type { CatalogOrderProduct, Category, Product } from "@/types";

export interface CatalogRepository {
  getCategories(): Promise<Category[]>;
  getBrands(): Promise<string[]>;
  getProducts(): Promise<Product[]>;
  getOrderProducts(): Promise<CatalogOrderProduct[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategory(categorySlug: string): Promise<Product[]>;
  getSimilarProducts(
    categorySlug: string,
    excludeSlug: string,
    take: number,
  ): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getBestSellingProducts(): Promise<Product[]>;
}
