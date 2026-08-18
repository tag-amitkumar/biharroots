import { prisma } from "@/lib/prisma";

export function upsertView(userId: string, productId: string) {
  return prisma.recentlyViewed.upsert({
    where: { userId_productId: { userId, productId } },
    update: { viewedAt: new Date() },
    create: { userId, productId },
  });
}

export function findRecentForUser(userId: string, limit: number) {
  return prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: limit,
    include: { product: true },
  });
}
