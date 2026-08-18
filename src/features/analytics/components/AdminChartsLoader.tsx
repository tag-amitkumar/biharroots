"use client";

import dynamic from "next/dynamic";

// recharts is one of the heaviest dependencies in the project and is only
// ever needed on this one admin page, so it's dynamically imported (client-
// only, no SSR) instead of bundled into the server render / shipped to every
// page that happens to share a chunk with the admin dashboard.
const AdminCharts = dynamic(() => import("./AdminCharts"), {
  ssr: false,
  loading: () => (
    <div className="mt-10 space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-80 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-80 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  ),
});

export default AdminCharts;
