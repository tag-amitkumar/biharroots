import { prisma } from "@/lib/prisma";

export function findCategoryPool(category: string, excludeIds: string[], limit: number) {
  return prisma.product.findMany({
    where: { category, id: { notIn: excludeIds } },
    include: { variants: true },
    take: limit,
  });
}

export function findOrderIdsContainingProduct(productId: string) {
  return prisma.orderItem.findMany({
    where: { productId },
    select: { orderId: true },
  });
}

export function findCoPurchaseCounts(orderIds: string[]) {
  return prisma.orderItem.groupBy({
    by: ["productId"],
    where: { orderId: { in: orderIds }, productId: { not: null } },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
  });
}

export function findTrendingCounts(since: Date, limit: number) {
  return prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null }, order: { createdAt: { gte: since } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
}

export function findPurchasedProductCategories(userId: string) {
  return prisma.orderItem.findMany({
    where: { productId: { not: null }, order: { userId } },
    select: { product: { select: { id: true, category: true } } },
  });
}
