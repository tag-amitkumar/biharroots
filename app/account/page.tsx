import Link from "next/link";
import { getServerSession } from "next-auth";
import { Bell, Heart, MapPin, Package, ShoppingBag } from "lucide-react";
import { authOptions } from "@/features/auth/auth-options";
import * as orderService from "@/features/orders/service";
import * as wishlistService from "@/features/wishlist/service";
import * as notificationService from "@/features/notifications/service";
import { Badge } from "@/components/ui/badge";

// Reads this user's live order/wishlist/notification counts on every visit.
export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const session = await getServerSession(authOptions);

  const [orders, wishlist, notifications] = await Promise.all([
    orderService.getOrdersForUser(session!.user.id, session!.user.email!),
    wishlistService.getWishlistForUser(session!.user.id),
    notificationService.getNotificationsForUser(session!.user.id),
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentOrders = orders.slice(0, 3);

  const stats = [
    { label: "Orders", value: orders.length, icon: Package, href: "/account/orders" },
    { label: "Wishlist", value: wishlist.length, icon: Heart, href: "/wishlist" },
    { label: "Notifications", value: unreadCount, icon: Bell, href: "/account/notifications" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                {stat.value}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-neutral-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Recent Orders
          </h2>

          <Link
            href="/account/orders"
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 text-neutral-500">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.orderId}`}
                className="flex items-center justify-between rounded-2xl border border-neutral-200/70 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
              >
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    Order #{order.orderId.slice(0, 8)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-600">₹{order.amount}</span>
                  <Badge variant="secondary">{order.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/account/addresses"
        className="flex items-center justify-between rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
      >
        <span className="flex items-center gap-3 font-semibold text-neutral-900 dark:text-white">
          <MapPin className="h-5 w-5 text-brand-600" /> Manage delivery addresses
        </span>
        <span className="text-sm text-neutral-400">&rarr;</span>
      </Link>
    </div>
  );
}
