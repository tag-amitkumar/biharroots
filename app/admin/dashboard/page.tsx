import * as productService from "@/features/products/service";
import * as orderService from "@/features/orders/service";
import * as userService from "@/features/users/service";
import * as analyticsService from "@/features/analytics/service";
import AdminCharts from "@/features/analytics/components/AdminChartsLoader";
import { Package, ShoppingCart, Users, Wallet } from "lucide-react";

// This page reads live product/order/user counts on every request; without
// this it would be statically prerendered once at build time and serve a
// frozen snapshot to every admin visitor until the next deploy.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const products = await productService.countProducts();

  const orders = await orderService.getAllOrders();

  const users = await userService.countUsers();

  const revenue = orders.reduce(
    (sum, order) => sum + order.amount,
    0
  );

  const [revenueOverTime, orderStatusBreakdown, topProducts, customers, inventory] =
    await Promise.all([
      analyticsService.getRevenueOverTime(),
      analyticsService.getOrderStatusBreakdown(),
      analyticsService.getTopSellingProducts(),
      analyticsService.getCustomerAnalytics(),
      analyticsService.getInventoryInsights(),
    ]);

  const stats = [
    { label: "Total Revenue", value: `₹${revenue}`, icon: Wallet },
    { label: "Total Orders", value: orders.length, icon: ShoppingCart },
    { label: "Total Products", value: products, icon: Package },
    { label: "Total Users", value: users, icon: Users },
  ];

  return (
    <div className="p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Overview
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        Admin Dashboard
      </h1>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">
          Recent Orders
        </h2>

        {orders.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="mb-3 flex justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800"
          >
            <span className="text-neutral-700 dark:text-neutral-200">{order.customer}</span>

            <span className="font-semibold text-neutral-900 dark:text-white">
              ₹{order.amount}
            </span>

            <span className="text-neutral-500">{order.status}</span>
          </div>
        ))}
      </div>

      <AdminCharts
        data={{
          revenueOverTime,
          orderStatusBreakdown,
          topProducts,
          customers,
          inventory,
        }}
      />
    </div>
  );
}
