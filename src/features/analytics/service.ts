import * as analyticsRepository from "@/features/analytics/repository";

export async function getRevenueOverTime(days = 14) {
  // Bucket by UTC calendar day throughout — createdAt.toISOString() is
  // always UTC, so the bucket keys must be generated in UTC too. Doing
  // this with local-timezone Date methods (setDate/setHours) and then
  // converting to ISO shifts "today" onto the wrong UTC day for any
  // server timezone ahead of UTC (e.g. IST, UTC+5:30 — local midnight
  // is still the previous UTC day), silently dropping same-day revenue.
  const now = new Date();
  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  const oneDayMs = 24 * 60 * 60 * 1000;
  const since = new Date(todayUTC - (days - 1) * oneDayMs);

  const orders = await analyticsRepository.findOrdersSince(since);

  const byDay = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    const d = new Date(todayUTC - (days - 1 - i) * oneDayMs);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }

  orders.forEach((order) => {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) || 0) + order.amount);
    }
  });

  return Array.from(byDay.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));
}

export async function getOrderStatusBreakdown() {
  const groups = await analyticsRepository.groupOrdersByStatus();

  return groups.map((group) => ({
    status: group.status,
    count: group._count.status,
  }));
}

export async function getTopSellingProducts(limit = 5) {
  const items = await analyticsRepository.findAllOrderItems();

  const byName = new Map<string, { quantity: number; revenue: number }>();

  items.forEach((item) => {
    const existing = byName.get(item.name) || { quantity: 0, revenue: 0 };
    existing.quantity += item.quantity;
    existing.revenue += item.price * item.quantity;
    byName.set(item.name, existing);
  });

  return Array.from(byName.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export async function getCustomerAnalytics() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [totalCustomers, newCustomers, orders] = await Promise.all([
    analyticsRepository.countCustomers(),
    analyticsRepository.countNewCustomersSince(since),
    analyticsRepository.findAllOrderTotalsByEmail(),
  ]);

  const byEmail = new Map<string, number>();

  orders.forEach((order) => {
    byEmail.set(order.email, (byEmail.get(order.email) || 0) + order.amount);
  });

  const topCustomers = Array.from(byEmail.entries())
    .map(([email, totalSpent]) => ({ email, totalSpent }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  return { totalCustomers, newCustomers, topCustomers };
}

export async function getInventoryInsights() {
  const LOW_STOCK_THRESHOLD = 10;

  const [lowStock, outOfStock] = await Promise.all([
    analyticsRepository.findLowStockProducts(LOW_STOCK_THRESHOLD),
    analyticsRepository.countOutOfStockProducts(),
  ]);

  return { lowStock, outOfStock };
}
