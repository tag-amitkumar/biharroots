import { Prisma } from "@prisma/client";
import * as categoryRepository from "@/features/categories/repository";
import * as filtering from "@/features/products/filtering";
import { CategoryValidationError } from "@/features/categories/errors";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getCategoryTree(includeDisabled = false) {
  return categoryRepository.findMainCategories(!includeDisabled);
}

export function getAllCategoriesFlat() {
  return categoryRepository.findAllCategories();
}

export async function getCategoryBySlug(slug: string) {
  const category = await categoryRepository.findCategoryBySlug(slug);

  if (category) {
    await categoryRepository.incrementViewCount(category.id);
  }

  return category;
}

export function getCategoryById(id: string) {
  return categoryRepository.findCategoryById(id);
}

type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  banner?: string;
  metaTitle?: string;
  metaDescription?: string;
  parentId?: string | null;
  featured?: boolean;
  showOnHomepage?: boolean;
  showInNav?: boolean;
};

export async function createCategory(input: CategoryInput) {
  const name = input.name?.trim();

  if (!name) {
    throw new CategoryValidationError("Category name is required");
  }

  let parentSlug: string | undefined;

  if (input.parentId) {
    const parent = await categoryRepository.findCategoryById(input.parentId);

    if (!parent) {
      throw new CategoryValidationError("Parent category not found");
    }

    if (parent.parentId) {
      throw new CategoryValidationError(
        "A subcategory cannot itself have subcategories (max 2 levels: category > subcategory)"
      );
    }

    parentSlug = parent.slug;
  }

  const baseSlug = input.slug?.trim() ? slugify(input.slug) : slugify(name);
  const slug = parentSlug && !input.slug?.trim() ? `${parentSlug}-${baseSlug}` : baseSlug;

  if (!slug) {
    throw new CategoryValidationError("Could not generate a valid slug from the category name");
  }

  const sortOrder = await categoryRepository.countSiblings(input.parentId ?? null);

  try {
    return await categoryRepository.createCategory({
      name,
      slug,
      description: input.description || "",
      icon: input.icon || "",
      banner: input.banner || "",
      metaTitle: input.metaTitle || `${name} | NatureCart`,
      metaDescription: input.metaDescription || input.description || "",
      parentId: input.parentId || null,
      featured: Boolean(input.featured),
      showOnHomepage: input.showOnHomepage ?? true,
      showInNav: input.showInNav ?? true,
      sortOrder,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new CategoryValidationError("A category with this slug already exists");
    }

    throw error;
  }
}

type CategoryUpdateInput = Partial<CategoryInput> & { enabled?: boolean };

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  const existing = await categoryRepository.findCategoryById(id);

  if (!existing) {
    throw new CategoryValidationError("Category not found");
  }

  if (input.parentId !== undefined && input.parentId !== existing.parentId) {
    if (input.parentId === id) {
      throw new CategoryValidationError("A category cannot be its own parent");
    }

    if (existing.children.length > 0) {
      throw new CategoryValidationError(
        "Cannot move a category with subcategories under another category"
      );
    }

    if (input.parentId) {
      const parent = await categoryRepository.findCategoryById(input.parentId);

      if (!parent) {
        throw new CategoryValidationError("Parent category not found");
      }

      if (parent.parentId) {
        throw new CategoryValidationError(
          "A subcategory cannot itself have subcategories (max 2 levels: category > subcategory)"
        );
      }
    }
  }

  const data: Prisma.CategoryUpdateInput = {};

  if (input.name?.trim()) data.name = input.name.trim();
  if (input.slug?.trim()) data.slug = slugify(input.slug);
  if (input.description !== undefined) data.description = input.description;
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.banner !== undefined) data.banner = input.banner;
  if (input.metaTitle !== undefined) data.metaTitle = input.metaTitle;
  if (input.metaDescription !== undefined) data.metaDescription = input.metaDescription;
  if (input.featured !== undefined) data.featured = input.featured;
  if (input.showOnHomepage !== undefined) data.showOnHomepage = input.showOnHomepage;
  if (input.showInNav !== undefined) data.showInNav = input.showInNav;
  if (input.enabled !== undefined) data.enabled = input.enabled;
  if (input.parentId !== undefined) {
    data.parent = input.parentId
      ? { connect: { id: input.parentId } }
      : { disconnect: true };
  }

  try {
    return await categoryRepository.updateCategory(id, data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new CategoryValidationError("A category with this slug already exists");
    }

    throw error;
  }
}

export function deleteCategory(id: string) {
  return categoryRepository.deleteCategory(id);
}

export function reorderCategories(orderedIds: string[]) {
  return categoryRepository.reorderCategories(
    orderedIds.map((id, index) => ({ id, sortOrder: index }))
  );
}

export async function getCategoryAnalytics() {
  const categories = await categoryRepository.findAllCategories();

  const totalViews = categories.reduce((sum, c) => sum + c.viewCount, 0);
  const totalProducts = categories.reduce((sum, c) => sum + c._count.products, 0);

  const topByViews = [...categories].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
  const topByProducts = [...categories]
    .sort((a, b) => b._count.products - a._count.products)
    .slice(0, 10);

  return {
    totalCategories: categories.length,
    totalViews,
    totalProducts,
    topByViews: topByViews.map((c) => ({ id: c.id, name: c.name, viewCount: c.viewCount })),
    topByProducts: topByProducts.map((c) => ({
      id: c.id,
      name: c.name,
      productCount: c._count.products,
    })),
  };
}

// A product assigned to a subcategory should also appear on its parent
// main-category's page - browsing "Fruits & Vegetables" should surface
// everything in "Fresh Fruits", "Leafy Greens", etc, not just products
// assigned directly to the parent itself.
export async function getCategoryIdsForBrowsing(category: { id: string; children?: { id: string }[] }) {
  return [category.id, ...(category.children?.map((child) => child.id) ?? [])];
}

export function getProductsForCategoryIds(
  categoryIds: string[],
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput,
  skip?: number,
  take?: number
) {
  const combinedWhere: Prisma.ProductWhereInput = {
    AND: [where, { categories: { some: { categoryId: { in: categoryIds } } } }],
  };

  return categoryRepository.findProductsWhereIn(combinedWhere, orderBy, skip, take);
}

export function countProductsForCategoryIds(categoryIds: string[], where: Prisma.ProductWhereInput) {
  return categoryRepository.countProductsWhereIn({
    AND: [where, { categories: { some: { categoryId: { in: categoryIds } } } }],
  });
}

export function getFeaturedProductsForCategory(categoryIds: string[], limit = 8) {
  return getProductsForCategoryIds(categoryIds, { featured: true }, { createdAt: "desc" }, 0, limit);
}

export function getNewArrivalsForCategory(categoryIds: string[], limit = 8) {
  return getProductsForCategoryIds(categoryIds, {}, { createdAt: "desc" }, 0, limit);
}

async function hydrateProductIdsInOrder(ids: string[]) {
  if (ids.length === 0) return [];

  const products = await categoryRepository.findProductsByIds(ids);
  const byId = new Map(products.map((product) => [product.id, product]));

  return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
}

// "Best Sellers": all-time sales volume within this category (and its
// subcategories, via categoryIds). Dynamically computed from real
// OrderItem data, not a manually-curated list - updates automatically as
// orders come in.
export async function getBestSellersForCategory(categoryIds: string[], limit = 8) {
  const groups = await categoryRepository.findBestSellingProductIdsForCategories(
    categoryIds,
    null,
    limit
  );

  return hydrateProductIdsInOrder(groups.map((g) => g.productId).filter((id): id is string => !!id));
}

const TRENDING_WINDOW_DAYS = 30;

// "Trending": last-30-day sales velocity within this category, backfilled
// with the newest in-category products when there isn't enough recent
// order history yet - same graceful-fallback shape as the global trending
// engine (Phase 3.5), just scoped to a category.
export async function getTrendingForCategory(categoryIds: string[], limit = 8) {
  const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const groups = await categoryRepository.findBestSellingProductIdsForCategories(
    categoryIds,
    since,
    limit
  );

  const trending = await hydrateProductIdsInOrder(
    groups.map((g) => g.productId).filter((id): id is string => !!id)
  );

  if (trending.length >= limit) return trending;

  const excludeIds = trending.map((p) => p.id);
  const fallback = await getProductsForCategoryIds(
    categoryIds,
    { id: { notIn: excludeIds } },
    { createdAt: "desc" },
    0,
    limit - trending.length
  );

  return [...trending, ...fallback];
}

// Used for client-side pagination ("load more") - deliberately does NOT
// increment the category's viewCount (that only happens once, on the
// initial page load via getCategoryBySlug above), so repeatedly paging
// through a category's products doesn't inflate its analytics. Reuses the
// exact same filter/sort engine as the main shop (products/filtering.ts),
// just scoped to this category's (and its subcategories') ids.
export async function getProductsForCategorySlug(
  slug: string,
  input: filtering.ProductFilterInput
) {
  const category = await categoryRepository.findCategoryBySlug(slug);

  if (!category || !category.enabled) return null;

  const categoryIds = await getCategoryIdsForBrowsing(category);

  const products = await filtering.findFilteredProducts(input, {
    categories: { some: { categoryId: { in: categoryIds } } },
  });

  return { category, products };
}

export async function getCategoriesForProduct(productId: string) {
  const rows = await categoryRepository.findCategoriesForProduct(productId);
  return rows.map((row) => row.categoryId);
}

export function assignCategoriesToProduct(productId: string, categoryIds: string[]) {
  return categoryRepository.replaceProductCategories(productId, [...new Set(categoryIds)]);
}
