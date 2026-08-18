import type { MetadataRoute } from "next";
import * as productService from "@/features/products/service";
import * as categoryService from "@/features/categories/service";
import { SITE_URL } from "@/lib/site";

// Rendered per request rather than prerendered: the product and category
// lists come from the database, so baking them in at build time would both
// require a reachable database during the build and freeze the sitemap at
// whatever the catalog looked like when the deploy went out.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    productService.listProducts({}),
    categoryService.getAllCategoriesFlat(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/compare`, changeFrequency: "weekly", priority: 0.3 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => category.enabled)
    .map((category) => ({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: category.updatedAt,
      // Main categories (no parentId) get a hair more weight than
      // subcategories, mirroring the priority split between /shop and
      // individual product pages below.
      changeFrequency: "daily",
      priority: category.parentId ? 0.6 : 0.8,
    }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
