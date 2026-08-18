"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import OrderStatusSelect, { ORDER_STATUSES } from "./OrderStatusSelect";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  customer: string;
  phone: string;
  amount: number;
  status: string;
};

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        order.customer.toLowerCase().includes(search.toLowerCase()) ||
        order.phone.includes(search);

      const matchesStatus = !statusFilter || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200/70 p-4 dark:border-neutral-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search by customer or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              statusFilter === ""
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
            )}
          >
            All
          </button>

          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === status
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <p className="ml-auto text-sm text-neutral-400">
          {filtered.length} of {orders.length} orders
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Customer</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Phone</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Amount</th>
              <th className="p-4 text-left text-sm font-semibold text-neutral-500">Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-400">
                  No orders match your search.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="p-4 text-neutral-900 dark:text-white">{order.customer}</td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-300">{order.phone}</td>
                  <td className="p-4 font-semibold text-neutral-900 dark:text-white">
                    ₹{order.amount}
                  </td>
                  <td className="p-4">
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
