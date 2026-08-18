import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function findAllCategories() {
  return prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export function findEnabledCategories() {
  return prisma.category.findMany({
    where: { enabled: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  });
}

export function findMainCategories(onlyEnabled: boolean) {
  return prisma.category.findMany({
    where: { parentId: null, ...(onlyEnabled ? { enabled: true } : {}) },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: onlyEnabled ? { enabled: true } : undefined,
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export function findCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: { orderBy: { sortOrder: "asc" } },
      _count: { select: { products: true } },
    },
  });
}

export function findCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: { children: true },
  });
}

type CategoryData = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  banner?: string;
  metaTitle?: string;
  metaDescription?: string;
  parentId?: string | null;
  featured?: boolean;
  showOnHomepage?: boolean;
  showInNav?: boolean;
  sortOrder?: number;
};

export function createCategory(data: CategoryData) {
  return prisma.category.create({ data });
}

export function updateCategory(id: string, data: Prisma.CategoryUpdateInput) {
  return prisma.category.update({ where: { id }, data });
}

export function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}

export function countSiblings(parentId: string | null) {
  return prisma.category.count({ where: { parentId } });
}

export function reorderCategories(updates: { id: string; sortOrder: number }[]) {
  return prisma.$transaction(
    updates.map((update) =>
      prisma.category.update({ where: { id: update.id }, data: { sortOrder: update.sortOrder } })
    )
  );
}

export function incrementViewCount(id: string) {
  return prisma.category.update({ where: { id }, data: { viewCount: { increment: 1 } } });
}

export function findProductIdsForCategories(categoryIds: string[]) {
  return prisma.productCategory.findMany({
    where: { categoryId: { in: categoryIds } },
    select: { productId: true },
    distinct: ["productId"],
  });
}

export function findProductsWhereIn(
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput,
  skip: number | undefined,
  take: number | undefined
) {
  return prisma.product.findMany({ where, orderBy, skip, take });
}

export function countProductsWhereIn(where: Prisma.ProductWhereInput) {
  return prisma.product.count({ where });
}

export function findProductsByIds(ids: string[]) {
  return prisma.product.findMany({ where: { id: { in: ids } } });
}

// One query serves both "best sellers" (since: null, all-time sales) and
// "trending" (since: a recent cutoff) for a set of categories - the only
// difference between the two is the date filter, so there's no need for
// two near-identical groupBy queries.
export function findBestSellingProductIdsForCategories(
  categoryIds: string[],
  since: Date | null,
  limit: number
) {
  return prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      product: { categories: { some: { categoryId: { in: categoryIds } } } },
      ...(since ? { order: { createdAt: { gte: since } } } : {}),
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
}

export function findCategoriesForProduct(productId: string) {
  return prisma.productCategory.findMany({
    where: { productId },
    select: { categoryId: true },
  });
}

export function replaceProductCategories(productId: string, categoryIds: string[]) {
  return prisma.$transaction([
    prisma.productCategory.deleteMany({ where: { productId } }),
    ...(categoryIds.length
      ? [
          prisma.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({ productId, categoryId })),
          }),
        ]
      : []),
  ]);
}
