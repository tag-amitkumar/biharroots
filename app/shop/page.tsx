"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid, List, SearchX } from "lucide-react";
import ProductCard from "@/features/products/components/ProductCard";
import ProductCardSkeleton from "@/features/products/components/ProductCardSkeleton";
import ProductFilters, {
  buildFilterSearchParams,
  DEFAULT_FILTERS,
  FilterState,
} from "@/features/products/components/ProductFilters";
import { getRatings } from "@/features/products/productsCache";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
};

type Rating = { productId: string; avgRating: number; reviewCount: number };

const PAGE_SIZE = 9;

function ShopContent() {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";

  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    category: searchParams.get("category") || "",
    sort: (searchParams.get("sort") as FilterState["sort"]) || "newest",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [products, setProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  function buildParams(pageNumber: number) {
    const params = buildFilterSearchParams(filters);

    if (search) params.set("search", search);
    params.set("page", String(pageNumber));
    params.set("pageSize", String(PAGE_SIZE));

    return params;
  }

  // Filters/search changed - reset to a fresh first page.
  useEffect(() => {
    Promise.resolve().then(() => {
      setInitialLoading(true);
      setPage(1);
      setHasMore(true);
    });

    fetch(`/api/products?${buildParams(1).toString()}`)
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        setHasMore(data.length === PAGE_SIZE);
        setInitialLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setInitialLoading(false);
      });

    getRatings().then(setRatings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || initialLoading) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    fetch(`/api/products?${buildParams(nextPage).toString()}`)
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts((prev) => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
        setPage(nextPage);
      })
      .finally(() => setLoadingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loadingMore, hasMore, initialLoading, search, filters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  function updateFilters(next: Partial<FilterState>) {
    setFilters((prev) => ({ ...prev, ...next }));
  }

  const ratingByProductId = new Map(ratings.map((r) => [r.productId, r]));

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          {search ? "Search Results" : "All Products"}
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white sm:text-5xl">
          {search ? `Results for "${search}"` : "Shop"}
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ProductFilters filters={filters} onChange={updateFilters} />
        </aside>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              {initialLoading ? "Loading..." : `${products.length}${hasMore ? "+" : ""} products`}
            </p>

            <div className="flex items-center gap-1 rounded-full border border-neutral-200 p-1 dark:border-neutral-800">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={cn(
                  "rounded-full p-2 transition-colors",
                  viewMode === "grid"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>

              <button
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={cn(
                  "rounded-full p-2 transition-colors",
                  viewMode === "list"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {initialLoading ? (
            <div
              className={cn(
                "grid gap-8",
                viewMode === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200/70 bg-white p-16 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <SearchX className="mx-auto h-12 w-12 text-neutral-300" />
              <p className="mt-4 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
                No products found
              </p>
              <p className="mt-2 text-neutral-500">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className={cn(
                  "grid gap-8",
                  viewMode === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}
              >
                {products.map((product) => {
                  const rating = ratingByProductId.get(product.id);

                  return (
                    <motion.div key={product.id} variants={fadeInUp}>
                      <ProductCard
                        layout={viewMode}
                        product={{
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          description: product.description,
                          rating: rating?.avgRating,
                          reviewCount: rating?.reviewCount,
                        }}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>

              <div ref={sentinelRef} className="mt-8">
                {loadingMore && (
                  <div
                    className={cn(
                      "grid gap-8",
                      viewMode === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                    )}
                  >
                    {Array.from({ length: 3 }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                )}

                {!hasMore && (
                  <p className="py-8 text-center text-sm text-neutral-400">
                    You&apos;ve reached the end of the collection.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}
