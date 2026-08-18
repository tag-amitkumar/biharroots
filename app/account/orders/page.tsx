"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Order = {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  status: string;
  createdAt: string;
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(data))
      .catch(() => setOrders([]));
  }, []);

  return (
    <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">Orders</h2>

      {orders === null ? (
        <p className="text-neutral-500">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center">
          <Package className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-neutral-500">You haven&apos;t placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.orderId}`}
              className="flex items-center justify-between rounded-2xl border border-neutral-200/70 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
            >
              <div>
                <p className="font-bold text-neutral-900 dark:text-white">Order #{order.orderId}</p>
                <p className="text-sm text-neutral-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-brand-600">₹{order.amount}</p>
                <Badge variant="secondary">{order.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
