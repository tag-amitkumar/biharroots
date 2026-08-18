import type { Metadata } from "next";
import * as categoryService from "@/features/categories/service";
import CategoryCard from "@/features/categories/components/CategoryCard";

export const metadata: Metadata = {
  title: "Browse All Categories",
  description: "Browse every product category at NatureCart, from fresh produce to eco-friendly essentials.",
};

// The category tree is admin-editable at runtime, so this page must not be
// prerendered - otherwise it would need a reachable database during the
// build and would then show a snapshot frozen at deploy time, ignoring
// every subsequent change made from /admin/categories.
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await categoryService.getCategoryTree();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Browse</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
        All Categories
      </h1>

      {categories.length === 0 ? (
        <p className="mt-10 text-neutral-500">No categories available right now.</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
