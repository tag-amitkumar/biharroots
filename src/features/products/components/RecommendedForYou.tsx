"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRecentlyViewedStore } from "@/features/products/recentlyViewedStore";
import ProductCard from "./ProductCard";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
};

export default function RecommendedForYou() {
  const { status } = useSession();
  const productIds = useRecentlyViewedStore((state) => state.productIds);
  const [recommended, setRecommended] = useState<Product[]>([]);

  // Signed-in customers with real order history get recommendations built
  // from what they've actually bought before, not the recently-viewed
  // heuristic below - that heuristic remains the fallback for guests and
  // brand-new customers who have no purchase history yet.
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/recommendations/for-you")
      .then((res) => res.json())
      .then((data: Product[]) => {
        if (data.length > 0) setRecommended(data);
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") return;

    if (productIds.length === 0) {
      Promise.resolve().then(() => setRecommended([]));
      return;
    }

    fetch(`/api/products?ids=${productIds.join(",")}`)
      .then((res) => res.json())
      .then(async (viewedProducts: Product[]) => {
        if (viewedProducts.length === 0) {
          setRecommended([]);
          return;
        }

        // Heuristic, not machine learning: recommend more of whichever
        // category shows up most often in what this browser has viewed.
        const counts = new Map<string, number>();
        viewedProducts.forEach((product) =>
          counts.set(product.category, (counts.get(product.category) || 0) + 1)
        );

        const topCategory = [...counts.entries()].sort(
          (a, b) => b[1] - a[1]
        )[0][0];

        const res = await fetch(
          `/api/products?category=${encodeURIComponent(topCategory)}`
        );
        const categoryProducts: Product[] = await res.json();

        const viewedIds = new Set(viewedProducts.map((product) => product.id));

        setRecommended(
          categoryProducts
            .filter((product) => !viewedIds.has(product.id))
            .slice(0, 4)
        );
      })
      .catch(() => setRecommended([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, productIds.join(",")]);

  if (recommended.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          Just For You
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold text-neutral-900 dark:text-white">
          Recommended For You
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {recommended.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              description: product.description,
            }}
          />
        ))}
      </div>
    </section>
  );
}
