import Link from "next/link";
import * as orderService from "@/features/orders/service";
import OrdersTable from "@/features/orders/components/OrdersTable";
import { Package, ShoppingCart, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Live order data on every request — see app/admin/dashboard/page.tsx
// for why this can't be statically prerendered.
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await orderService.getAllOrders();

  const revenue = orders.reduce(
    (sum, order) => sum + order.amount,
    0
  );

  const stats = [
    { label: "Total Orders", value: orders.length, icon: ShoppingCart },
    { label: "Revenue", value: `₹${revenue}`, icon: Wallet },
    {
      label: "Pending",
      value: orders.filter((o) => o.status === "Pending").length,
      icon: Clock,
    },
    {
      label: "Completed",
      value: orders.filter((o) => o.status === "Completed").length,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Sales
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
            Orders
          </h1>
        </div>

        <Button asChild variant="primary">
          <Link href="/admin/products/list">
            <Package className="h-4 w-4" /> Manage Products
          </Link>
        </Button>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-4">
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

      <OrdersTable orders={orders} />
    </div>
  );
}
