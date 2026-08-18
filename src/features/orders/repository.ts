import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function findOrdersForUser(userId: string, email: string) {
  return prisma.order.findMany({
    where: { OR: [{ userId }, { email }] },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

// Most-recent-first orders with their items' product data attached, for
// deriving "Buy It Again" from real purchase history. Capped rather than
// unbounded since only the most recent handful of orders can ever surface
// enough distinct products to fill a small homepage section.
export function findRecentOrdersWithProductsForUser(userId: string, orderLimit: number) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: orderLimit,
    include: { items: { include: { product: true } } },
  });
}

export function findOrderByOrderId(orderId: string) {
  return prisma.order.findFirst({
    where: { orderId },
    include: { items: true },
  });
}

export function findOrderById(id: string) {
  return prisma.order.findUnique({ where: { id } });
}

export function findAllOrders() {
  return prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export function createOrder(data: Prisma.OrderCreateInput) {
  return prisma.order.create({ data });
}

export function updateOrderStatus(id: string, status: string) {
  return prisma.order.update({ where: { id }, data: { status } });
}

export function updateOrderCoinsEarned(id: string, coinsEarned: number) {
  return prisma.order.update({ where: { id }, data: { coinsEarned } });
}
