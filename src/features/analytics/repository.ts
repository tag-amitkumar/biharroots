import { prisma } from "@/lib/prisma";

export function findOrdersSince(since: Date) {
  return prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
  });
}

export function groupOrdersByStatus() {
  return prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });
}

export function findAllOrderItems() {
  return prisma.orderItem.findMany({
    select: { name: true, price: true, quantity: true },
  });
}

export function countCustomers() {
  return prisma.user.count({ where: { role: "user" } });
}

export function countNewCustomersSince(since: Date) {
  return prisma.user.count({
    where: { role: "user", createdAt: { gte: since } },
  });
}

export function findAllOrderTotalsByEmail() {
  return prisma.order.findMany({ select: { email: true, amount: true } });
}

export function findLowStockProducts(threshold: number, limit = 10) {
  return prisma.product.findMany({
    where: { stock: { lte: threshold, gt: 0 } },
    orderBy: { stock: "asc" },
    take: limit,
  });
}

export function countOutOfStockProducts() {
  return prisma.product.count({ where: { stock: 0 } });
}
