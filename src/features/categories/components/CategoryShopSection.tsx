"use client";

import { useState } from "react";
import ProductFilters, { DEFAULT_FILTERS, FilterState } from "@/features/products/components/ProductFilters";
import CategoryProductGrid from "@/features/categories/components/CategoryProductGrid";

export default function CategoryShopSection({ slug }: { slug: string }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  function updateFilters(next: Partial<FilterState>) {
    setFilters((prev) => ({ ...prev, ...next }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <ProductFilters filters={filters} onChange={updateFilters} hideCategoryFilter />
      </aside>

      <div>
        <CategoryProductGrid slug={slug} filters={filters} />
      </div>
    </div>
  );
}
