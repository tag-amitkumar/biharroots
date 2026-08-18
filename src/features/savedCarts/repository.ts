import { prisma } from "@/lib/prisma";

export function findSavedCartsForUser(userId: string) {
  return prisma.savedCart.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function createSavedCart(userId: string, name: string, items: string) {
  return prisma.savedCart.create({ data: { userId, name, items } });
}

export function deleteSavedCart(id: string, userId: string) {
  return prisma.savedCart.deleteMany({ where: { id, userId } });
}
