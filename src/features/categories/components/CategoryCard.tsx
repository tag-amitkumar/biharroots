"use client";

import Link from "next/link";
import SafeImage from "@/components/SafeImage";

export type CategoryCardData = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  banner: string;
};

// Shared visual for both the homepage "Shop by Category" section and the
// full "Browse All Categories" page, so the two stay visually consistent.
export default function CategoryCard({ category }: { category: CategoryCardData }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-neutral-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-brand-50 dark:bg-neutral-800">
        <SafeImage
          src={category.banner}
          alt={category.name}
          fill
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition duration-700 group-hover:scale-110"
          kind="category"
        />
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 p-4 text-center">
        <span className="text-xl">{category.icon || "🌿"}</span>
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{category.name}</h3>
      </div>
    </Link>
  );
}
