"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, MapPin, Package, Truck } from "lucide-react";
import { ORDER_STATUSES } from "@/features/orders/components/OrderStatusSelect";
import { cn } from "@/lib/utils";

type OrderItem = { id: string; name: string; price: number; quantity: number };

type Order = {
  id: string;
  orderId: string;
  customer: string;
  phone: string;
  email: string;
  address: string;
  amount: number;
  status: string;
  shippingMethod: string;
  createdAt: string;
  items: OrderItem[];
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOrder(data))
      .catch(() => setOrder(null));
  }, [orderId]);

  if (order === undefined) {
    return (
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        Order not found.
      </div>
    );
  }

  const stageIndex =
    order.status === "Cancelled" ? -1 : ORDER_STATUSES.indexOf(order.status);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
          Order #{order.orderId}
        </h2>
        <p className="text-neutral-500">
          Placed on {new Date(order.createdAt).toLocaleDateString()}
        </p>

        {stageIndex >= 0 ? (
          <div className="mt-10 flex items-center">
            {ORDER_STATUSES.map((stage, index) => (
              <div
                key={stage}
                className="flex flex-1 items-center last:flex-none"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors",
                      index <= stageIndex
                        ? "bg-brand-600 text-white"
                        : "bg-neutral-200 text-neutral-400 dark:bg-neutral-800"
                    )}
                  >
                    {index < stageIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </div>

                  <p
                    className={cn(
                      "mt-2 whitespace-nowrap text-xs font-semibold",
                      index <= stageIndex ? "text-brand-700 dark:text-brand-400" : "text-neutral-400"
                    )}
                  >
                    {stage}
                  </p>
                </div>

                {index < ORDER_STATUSES.length - 1 && (
                  <div className="mx-2 h-1 flex-1 overflow-hidden rounded bg-neutral-200 dark:bg-neutral-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: index < stageIndex ? "100%" : "0%" }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full bg-brand-600"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">
            This order was cancelled.
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
          <Package className="h-4 w-4 text-brand-600" /> Items
        </h3>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between border-b border-neutral-100 pb-3 text-sm dark:border-neutral-800"
            >
              <span className="text-neutral-600 dark:text-neutral-300">
                {item.name} × {item.quantity}
              </span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between font-bold text-neutral-900 dark:text-white">
          <span>Total</span>
          <span>₹{order.amount}</span>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
          <MapPin className="h-4 w-4 text-brand-600" /> Delivery Details
        </h3>
        <p className="text-neutral-600 dark:text-neutral-300">{order.customer}</p>
        <p className="text-neutral-600 dark:text-neutral-300">{order.phone}</p>
        <p className="text-neutral-600 dark:text-neutral-300">{order.address}</p>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
          <Truck className="h-3.5 w-3.5" /> {order.shippingMethod}
        </p>
      </div>
    </div>
  );
}
