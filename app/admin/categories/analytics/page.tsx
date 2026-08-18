"use client";

import { useEffect, useState } from "react";
import { BarChart3, Eye, Package, LayoutGrid } from "lucide-react";

type Analytics = {
  totalCategories: number;
  totalViews: number;
  totalProducts: number;
  topByViews: { id: string; name: string; viewCount: number }[];
  topByProducts: { id: string; name: string; productCount: number }[];
};

export default function CategoryAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories/analytics")
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null));
  }, []);

  return (
    <div className="p-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
        Catalog
      </p>
      <h1 className="mb-8 mt-2 flex items-center gap-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        <BarChart3 className="h-8 w-8 text-brand-600" /> Category Analytics
      </h1>

      {!analytics ? (
        <div className="h-40 animate-pulse rounded-3xl bg-neutral-200 dark:bg-neutral-800" />
      ) : (
        <>
          <div className="mb-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
                {analytics.totalCategories}
              </p>
              <p className="text-sm text-neutral-500">Total Categories</p>
            </div>

            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20">
                <Eye className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
                {analytics.totalViews}
              </p>
              <p className="text-sm text-neutral-500">Total Page Views</p>
            </div>

            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20">
                <Package className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
                {analytics.totalProducts}
              </p>
              <p className="text-sm text-neutral-500">Category-Product Assignments</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">
                Most Viewed Categories
              </h2>

              {analytics.topByViews.length === 0 ? (
                <p className="text-sm text-neutral-400">No views recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.topByViews.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-2.5 dark:border-neutral-800"
                    >
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        {i + 1}. {c.name}
                      </span>
                      <span className="text-sm font-bold text-brand-600">{c.viewCount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">
                Categories With The Most Products
              </h2>

              {analytics.topByProducts.length === 0 ? (
                <p className="text-sm text-neutral-400">No products assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.topByProducts.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-2.5 dark:border-neutral-800"
                    >
                      <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                        {i + 1}. {c.name}
                      </span>
                      <span className="text-sm font-bold text-brand-600">{c.productCount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
