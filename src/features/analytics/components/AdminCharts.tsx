"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Processing: "#3b82f6",
  Shipped: "#8b5cf6",
  Completed: "#16a34a",
  Cancelled: "#ef4444",
};

type Analytics = {
  revenueOverTime: { date: string; revenue: number }[];
  orderStatusBreakdown: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  customers: {
    totalCustomers: number;
    newCustomers: number;
    topCustomers: { email: string; totalSpent: number }[];
  };
  inventory: {
    lowStock: { id: string; name: string; stock: number }[];
    outOfStock: number;
  };
};

export default function AdminCharts({ data }: { data: Analytics }) {
  return (
    <div className="mt-10 space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 font-bold text-neutral-900 dark:text-white">Revenue (Last 14 Days)</h3>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => value.slice(5)}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#16a34a"
                fill="#bbf7d0"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 font-bold text-neutral-900 dark:text-white">Orders by Status</h3>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.orderStatusBreakdown}
                dataKey="count"
                nameKey="status"
                outerRadius={90}
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
                {data.orderStatusBreakdown.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] || "#9ca3af"}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 font-bold text-neutral-900 dark:text-white">Top-Selling Products</h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                fontSize={12}
              />
              <Tooltip />
              <Bar dataKey="quantity" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-4 font-bold text-neutral-900 dark:text-white">Customer Analytics</h3>

          <div className="mb-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {data.customers.totalCustomers}
              </p>
              <p className="text-sm text-neutral-500">Total Customers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-600">
                +{data.customers.newCustomers}
              </p>
              <p className="text-sm text-neutral-500">New (30 days)</p>
            </div>
          </div>

          <h4 className="mb-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
            Top Customers
          </h4>

          <div className="space-y-2">
            {data.customers.topCustomers.map((customer) => (
              <div
                key={customer.email}
                className="flex justify-between text-sm"
              >
                <span className="truncate text-neutral-700 dark:text-neutral-200">
                  {customer.email}
                </span>
                <span className="font-semibold text-brand-600">
                  ₹{customer.totalSpent}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900 dark:text-white">Inventory Insights</h3>
          <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {data.inventory.outOfStock} out of stock
          </span>
        </div>

        {data.inventory.lowStock.length === 0 ? (
          <p className="text-sm text-neutral-500">No products are low on stock.</p>
        ) : (
          <div className="space-y-2">
            {data.inventory.lowStock.map((product) => (
              <div
                key={product.id}
                className="flex justify-between text-sm"
              >
                <span className="text-neutral-700 dark:text-neutral-200">{product.name}</span>
                <span className="font-semibold text-orange-500">
                  {product.stock} left
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
