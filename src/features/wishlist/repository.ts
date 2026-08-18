import { prisma } from "@/lib/prisma";

export function findWishlistForUser(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: { product: true },
  });
}

export function addToWishlist(userId: string, productId: string) {
  return prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}

export function removeFromWishlist(userId: string, productId: string) {
  return prisma.wishlist.deleteMany({ where: { userId, productId } });
}

export function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, wishlistShareToken: true },
  });
}

export function setWishlistShareToken(userId: string, token: string) {
  return prisma.user.update({ where: { id: userId }, data: { wishlistShareToken: token } });
}

export function findUserByShareToken(token: string) {
  return prisma.user.findUnique({
    where: { wishlistShareToken: token },
    select: { id: true, name: true },
  });
}
