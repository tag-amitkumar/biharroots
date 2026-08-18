"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import ProductCard from "@/features/products/components/ProductCard";
import ProductCardSkeleton from "@/features/products/components/ProductCardSkeleton";
import { FilterState, buildFilterSearchParams } from "@/features/products/components/ProductFilters";
import { getRatings } from "@/features/products/productsCache";
import { fadeInUp, staggerContainer } from "@/lib/motion";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

type Rating = { productId: string; avgRating: number; reviewCount: number };

const PAGE_SIZE = 12;

export default function CategoryProductGrid({
  slug,
  filters,
}: {
  slug: string;
  filters: FilterState;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  function buildParams(pageNumber: number) {
    const params = buildFilterSearchParams(filters);

    params.set("page", String(pageNumber));
    params.set("pageSize", String(PAGE_SIZE));

    return params;
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      setInitialLoading(true);
      setPage(1);
      setHasMore(true);
    });

    fetch(`/api/categories/${slug}/products?${buildParams(1).toString()}`)
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(Array.isArray(data) ? data : []);
        setHasMore(Array.isArray(data) && data.length === PAGE_SIZE);
        setInitialLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setInitialLoading(false);
      });

    getRatings().then(setRatings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, filters]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || initialLoading) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    fetch(`/api/categories/${slug}/products?${buildParams(nextPage).toString()}`)
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
        setHasMore(Array.isArray(data) && data.length === PAGE_SIZE);
        setPage(nextPage);
      })
      .finally(() => setLoadingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loadingMore, hasMore, initialLoading, slug, filters]);

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

  const ratingByProductId = new Map(ratings.map((r) => [r.productId, r]));

  if (initialLoading) {
    return (
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-neutral-200/70 bg-white p-16 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <SearchX className="mx-auto h-12 w-12 text-neutral-300" />
        <p className="mt-4 text-lg font-semibold text-neutral-700 dark:text-neutral-200">
          No products found
        </p>
        <p className="mt-2 text-neutral-500">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3"
      >
        {products.map((product) => {
          const rating = ratingByProductId.get(product.id);

          return (
            <motion.div key={product.id} variants={fadeInUp}>
              <ProductCard
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
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!hasMore && (
          <p className="py-8 text-center text-sm text-neutral-400">
            You&apos;ve reached the end of this category.
          </p>
        )}
      </div>
    </>
  );
}
